/**
 * Business Bookings API
 * Create and manage business bookings
 */

import { NextRequest, after } from 'next/server';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { bookingCreationSchema } from '@/lib/business/validators';
import { createClient } from '@supabase/supabase-js';
import { sendBusinessCustomerBookingConfirmationEmail } from '@/lib/business/email/services/business-emails';
import { notifyBusinessBookingCreated } from '@/lib/business/email/notify';
import { buildBusinessSideRecipients } from '@/lib/business/email/recipients';
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails';
import { getAdminEmail, getAppUrl } from '@/lib/email/config';
import { getExchangeRates } from '@/lib/currency/server';
import { BUSINESS_BASE_CURRENCY, convertFromAed } from '@/lib/business/wallet-operations';
import { verifyBusinessQuoteSignature } from '@/lib/security/booking-hmac';
import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation';
import { activityLogger } from '@/lib/business/activity/log';
import { getBookingTimezone } from '@/lib/business/utils/timezone';

/**
 * Mail goes out inside after(), which runs on the platform's clock, not the response's.
 * A tenant's own SMTP server is a multi round-trip conversation bounded by
 * SEND_DEADLINE_MS (25s, lib/email/transport/deliver.ts), so the invocation needs room
 * past that or it is cut off mid-send with nothing written to the delivery log.
 *
 * 60 is the Vercel Hobby ceiling. Raising it needs a plan that allows it.
 */
export const maxDuration = 60;

/**
 * POST /api/business/bookings
 * Create new booking with atomic wallet deduction
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, bookingCreationSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  // Use admin client to call database function
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // ─── HMAC Signature Verification ────────────────────────────────────────────
  const hmacResult = verifyBusinessQuoteSignature({
    fromLocationId: body.from_location_id,
    toLocationId: body.to_location_id,
    vehicleTypeId: body.vehicle_type_id,
    basePrice: body.base_price,
    businessAccountId: user.businessAccountId,
    signature: body.price_signature,
    timestamp: body.price_signature_timestamp,
    nonce: body.price_signature_nonce,
  });

  if (!hmacResult.valid) {
    console.error('SECURITY ALERT: Business booking HMAC failed', {
      reason: hmacResult.reason,
      businessAccountId: user.businessAccountId,
      vehicleTypeId: body.vehicle_type_id,
    });
    return apiError('Price quote verification failed. Please restart the booking.', 403);
  }

  // ─── Server-Side Price Recalculation ────────────────────────────────────────
  const priceResult = await calculateBusinessBookingPrice(supabaseAdmin, {
    fromLocationId: body.from_location_id,
    toLocationId: body.to_location_id,
    vehicleTypeId: body.vehicle_type_id,
    passengerCount: body.passenger_count,
    // Prices from the client are deliberately dropped and re-derived; child_ages is carried through
    // because it is data, not a price, and the DB flag decides whether it is required at all.
    selectedAddons: body.selected_addons?.map((a) => ({
      addon_id: a.addon_id,
      quantity: a.quantity,
      child_ages: a.child_ages,
    })),
    // Needed to cap child seats at the declared children + infants.
    children: body.children,
    infants: body.infants,
  });

  if ('error' in priceResult) {
    console.error('Price verification failed:', priceResult.error);
    return apiError(priceResult.error, 403);
  }

  // Log any discrepancy between client-sent and server-calculated prices
  if (Math.abs(body.total_price - priceResult.totalPrice) > 0.01) {
    console.warn('SECURITY WARNING: Price discrepancy detected', {
      clientTotal: body.total_price,
      serverTotal: priceResult.totalPrice,
      clientBase: body.base_price,
      serverBase: priceResult.basePrice,
      businessAccountId: user.businessAccountId,
      vehicleTypeId: body.vehicle_type_id,
    });
  }

  // Use server-calculated prices (ignore client values)
  const verifiedBasePrice = priceResult.basePrice;
  const verifiedTotalPrice = priceResult.totalPrice;

  try {
    // Call atomic function to create booking and deduct from wallet
    const { data: bookingId, error } = await supabaseAdmin.rpc(
      'create_booking_with_wallet_deduction',
      {
        p_business_id: user.businessAccountId,
        p_created_by_user_id: user.businessId,
        p_customer_name: body.customer_name,
        p_customer_email: body.customer_email,
        p_customer_phone: body.customer_phone,
        p_from_location_id: body.from_location_id,
        p_to_location_id: body.to_location_id,
        p_pickup_address: body.pickup_address,
        p_dropoff_address: body.dropoff_address,
        p_pickup_datetime: body.pickup_datetime,
        p_vehicle_type_id: body.vehicle_type_id,
        p_passenger_count: body.passenger_count,
        p_adults: body.adults,
        p_children: body.children,
        p_infants: body.infants,
        p_base_price: verifiedBasePrice,
        p_total_price: verifiedTotalPrice,
        p_customer_notes: body.customer_notes || null,
        p_reference_number: body.reference_number || null,
        p_price_signature: body.price_signature,
        p_price_signature_timestamp: body.price_signature_timestamp,
        p_price_signature_nonce: body.price_signature_nonce,
      }
    );

    if (error) {
      console.error('Booking creation error:', error);

      // Rejections cannot be logged from inside the money functions: they
      // RAISE, which rolls the whole transaction back and takes any log row
      // with it. This is the only place a refusal can be recorded, and it is
      // the row that answers "why did my staff say they could not book".
      const rejectionReason = error.message.includes('Insufficient wallet balance')
        ? 'insufficient_balance'
        : error.message.includes('spending limit exceeded')
          ? 'spending_limit_exceeded'
          : error.message.includes('Wallet is frozen')
            ? 'wallet_frozen'
            : error.message.includes('not active')
              ? 'account_not_active'
              : null;

      if (rejectionReason) {
        await activityLogger(user, request)('wallet.payment_rejected', {
          amount: verifiedTotalPrice,
          currency: 'AED',
          metadata: {
            reason_code: rejectionReason,
            // A curated sentence, never error.message: that string can carry the
            // exact balance and limits, and it is not written for an owner.
            reason_public:
              rejectionReason === 'insufficient_balance'
                ? 'The wallet balance was not enough to cover this booking'
                : rejectionReason === 'spending_limit_exceeded'
                  ? 'A spending limit set on this wallet was reached'
                  : rejectionReason === 'wallet_frozen'
                    ? 'The wallet is frozen'
                    : 'The business account is not active',
            attempted_by_label: user.memberName ?? user.memberEmail ?? 'A team member',
          },
        });
      }

      // Check for insufficient balance error
      if (error.message.includes('Insufficient wallet balance')) {
        return apiError('Insufficient wallet balance. Please add credits.', 402);
      }

      // Check for account status errors
      if (error.message.includes('not active')) {
        return apiError('Business account is not active. Contact support.', 403);
      }

      // Check for nonce replay (duplicate signature usage)
      if (error.message.includes('idx_business_bookings_price_signature_nonce')) {
        return apiError('This booking quote has already been used. Please get a new quote.', 409);
      }

      // Check for spending limit exceeded errors and send notifications
      if (error.message.includes('spending limit exceeded')) {
        const isDailyLimit = error.message.includes('Daily');
        const limitType = isDailyLimit ? 'daily' : 'monthly';

        // Send spending limit notification asynchronously (don't await to not slow down response)
        (async () => {
          try {
            // Get owner's auth_user_id for in-app notification
            const { data: ownerUser } = await supabaseAdmin
              .from('business_users')
              .select('auth_user_id')
              .eq('business_account_id', user.businessAccountId)
              .eq('role', 'owner')
              .single();

            // Get business account details
            const { data: account } = await supabaseAdmin
              .from('business_accounts')
              .select('max_daily_spend, max_monthly_spend, currency')
              .eq('id', user.businessAccountId)
              .single();

            const limitAmount = isDailyLimit ? account?.max_daily_spend : account?.max_monthly_spend;
            const currency = account?.currency || 'AED';

            // Send in-app notification
            if (ownerUser?.auth_user_id) {
              await supabaseAdmin.rpc('create_business_notification', {
                p_business_user_auth_id: ownerUser.auth_user_id,
                p_category: 'payment',
                p_type: 'spending_limit_reached',
                p_title: `${isDailyLimit ? 'Daily' : 'Monthly'} Spending Limit Reached`,
                p_message: `Your ${limitType} spending limit of ${limitAmount} ${currency} has been reached. Transaction rejected.`,
                p_data: {
                  limit_type: limitType,
                  limit_amount: limitAmount,
                  rejected_amount: verifiedTotalPrice,
                  currency,
                },
                p_link: '/business/wallet/settings',
              });
            }

            // Send email notification via internal API
            // getAppUrl(), not the bare env var: unset, `${process.env.NEXT_PUBLIC_APP_URL}`
            // interpolates to the string "undefined" and fetch throws on the URL, which the
            // catch below then swallows.
            //
            // Keep this absolute and pinned to the platform origin. /api/internal/* is
            // outside the custom-domain allowlist in lib/business/domain-routing.ts, so a
            // relative URL would be answered with a 307 to /business/login by proxy.ts and
            // fail as a 200 with an HTML body.
            await fetch(`${getAppUrl()}/api/internal/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                notification_type: 'spending_limit_reached',
                business_account_id: user.businessAccountId,
                email_data: {
                  limitType,
                  limitAmount,
                  currentSpend: limitAmount, // Already at limit
                  rejectedTransactionAmount: verifiedTotalPrice,
                },
              }),
            });
          } catch (notifyError) {
            console.error('Failed to send spending limit notification:', notifyError);
          }
        })();

        return apiError(
          `${isDailyLimit ? 'Daily' : 'Monthly'} spending limit exceeded. Contact administrator.`,
          402
        );
      }

      return apiError(error.message || 'Failed to create booking', 500);
    }

    // Insert verified addons (server-verified prices, not client-sent)
    if (priceResult.verifiedAddons.length > 0) {
      const addonRecords = priceResult.verifiedAddons.map((addon) => ({
        business_booking_id: bookingId,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.total_price,
        child_ages: addon.child_ages,
      }));

      const { error: addonsError } = await supabaseAdmin
        .from('business_booking_addons')
        .insert(addonRecords);

      if (addonsError) {
        // A child seat is a legally-required item the driver has to physically bring, and the
        // wallet has ALREADY been charged for it by create_booking_with_wallet_deduction. Losing
        // that row silently is not acceptable the way losing "In-Car WiFi" is.
        const hasChildSeat = priceResult.verifiedAddons.some((a) => a.child_ages !== null);

        if (hasChildSeat) {
          console.error(
            'OPS ALERT: booking created and wallet charged, but child-seat addons failed to save',
            {
              bookingId,
              businessAccountId: user.businessAccountId,
              addons: priceResult.verifiedAddons.map((a) => ({ name: a.name, qty: a.quantity })),
              error: addonsError,
            }
          );
          // The booking row is committed and the wallet is debited, so there is nothing to roll
          // back. The error must say so explicitly, or the business retries and pays twice.
          return apiError(
            `Your booking was created and charged (reference ${bookingId}), but the child seat could ` +
              `not be recorded. Do not rebook. Contact support with this reference so the seat is added.`,
            500
          );
        }

        console.error('Failed to save booking addons:', addonsError);
        // Non-child addons stay non-fatal: they are supplementary and the booking still stands.
      }
    }

    // Get the created booking details with related data
    const { data: booking } = await supabaseAdmin
      .from('business_bookings')
      .select(`
        id,
        booking_number,
        trip_number,
        customer_name,
        customer_email,
        customer_phone,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        total_price,
        reference_number,
        passenger_count,
        adults,
        children,
        infants,
        vehicle_types:vehicle_type_id(name, category:vehicle_categories!category_id(name)),
        from_location:from_location_id(name),
        to_location:to_location_id(name)
      `)
      .eq('id', bookingId)
      .single();

    // Get business account details for email
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('business_name, business_email, wallet_balance, preferred_currency')
      .eq('id', user.businessAccountId)
      .single();

    // Send booking confirmation emails
    if (booking && businessAccount) {
      const vehicle = booking.vehicle_types as unknown as {
        name: string;
        category: { name: string } | null;
      } | null;

      const pickupLocation = booking.from_location?.name
        ? `${booking.from_location.name}${booking.pickup_address ? ` - ${booking.pickup_address}` : ''}`
        : booking.pickup_address || 'N/A';

      const dropoffLocation = booking.to_location?.name
        ? `${booking.to_location.name}${booking.dropoff_address ? ` - ${booking.dropoff_address}` : ''}`
        : booking.dropoff_address || 'N/A';

      const pickupDateTime = new Date(booking.pickup_datetime).toLocaleString('en-US', {
        timeZone: getBookingTimezone(),
        dateStyle: 'full',
        timeStyle: 'short',
      });

      // The admin template takes date and time as separate rows.
      const pickupDate = new Date(booking.pickup_datetime).toLocaleDateString('en-US', {
        timeZone: getBookingTimezone(),
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const pickupTime = new Date(booking.pickup_datetime).toLocaleTimeString('en-US', {
        timeZone: getBookingTimezone(),
        hour: '2-digit', minute: '2-digit',
      });

      // Prices, the wallet and the Stripe charge are all denominated in AED.
      const currency = BUSINESS_BASE_CURRENCY;

      const extras = priceResult.verifiedAddons.map((addon) => ({
        label: addon.name,
        quantity: addon.quantity,
        price: addon.total_price,
        // Undefined rather than null so the templates can treat it as simply absent. Survives the
        // currency conversion below, which spreads each entry.
        childAges: addon.child_ages ?? undefined,
      }));

      // The owner email is rendered in the business's preferred currency, with the AED
      // figure actually charged shown alongside. The admin email stays AED (below).
      const displayCurrency = businessAccount.preferred_currency || BUSINESS_BASE_CURRENCY;
      const rates = await getExchangeRates();
      const toDisplay = (aed: number) => convertFromAed(aed, displayCurrency, rates);
      const isConverted = displayCurrency !== BUSINESS_BASE_CURRENCY;
      const extrasForOwner = extras.map((e) => ({ ...e, price: toDisplay(e.price) }));

      // The creator is the caller, so this costs no queries: requireBusinessAuth already
      // carries the member's id, name and address. Every other trigger site has to look
      // the creator up, because there the actor is usually not the person who booked it.
      const recipients = buildBusinessSideRecipients({
        ownerEmail: businessAccount.business_email,
        ownerName: businessAccount.business_name,
        creator: {
          memberId: user.businessId,
          email: user.memberEmail,
          name: user.memberName,
          role: user.role,
          isActive: true,
        },
      });

      // The caller does not wait on mail: everything here runs inside after(), which
      // Next runs once the response has been flushed.
      //
      // Every send must be awaited in there, though. after() keeps the invocation alive
      // only for as long as the promise its callback returns is pending, so an async
      // callback that merely starts three promises returns on the first tick and extends
      // the invocation by nothing. On a long-lived Node host the orphans still finish; on
      // a serverless host the instance freezes at the response and takes the send and its
      // delivery-log row with it. That is how business bookings made on the Vercel-served
      // custom domain went out with no mail and no row in the delivery log at all.
      //
      // allSettled, not all: each send carries its own .catch, so nothing can reject here,
      // and one bad recipient must not abandon the others.
      after(async () => {
        const sends: Promise<unknown>[] = [];

        // To the owner, and to the staff member who created it. One send when they are the
        // same person; see lib/business/email/recipients.ts for the full rule.
        sends.push(notifyBusinessBookingCreated(recipients, {
          businessAccountId: user.businessAccountId,
          businessName: businessAccount.business_name,
          bookingNumber: booking.booking_number,
          tripNumber: booking.trip_number,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          pickupLocation,
          dropoffLocation,
          pickupDateTime,
          vehicleType: vehicle?.name || 'Standard',
          passengerCount: booking.passenger_count,
          adults: booking.adults,
          children: booking.children,
          infants: booking.infants,
          totalPrice: toDisplay(booking.total_price),
          currency: displayCurrency,
          originalAmount: isConverted ? booking.total_price : undefined,
          originalCurrency: isConverted ? currency : undefined,
          walletDeducted: toDisplay(booking.total_price),
          newBalance: toDisplay(businessAccount.wallet_balance),
          bookingUrl: `${getAppUrl()}/business/bookings/${booking.id}`,
          referenceNumber: booking.reference_number,
          extras: extrasForOwner,
        }).catch((err: unknown) => {
          console.error('Failed to send booking confirmation email:', err);
        }));

        // Send confirmation to customer
        if (booking.customer_email) {
          sends.push(sendBusinessCustomerBookingConfirmationEmail({
            businessAccountId: user.businessAccountId,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            businessName: businessAccount.business_name,
            bookingNumber: booking.booking_number,
            tripNumber: booking.trip_number,
            pickupLocation,
            dropoffLocation,
            pickupDateTime,
            vehicleType: vehicle?.name || 'Standard',
            passengerCount: booking.passenger_count,
          adults: booking.adults,
          children: booking.children,
          infants: booking.infants,
            referenceNumber: booking.reference_number,
            extras,
          }).catch((err: unknown) => {
            console.error('Failed to send customer booking confirmation email:', err);
          }));
        } else {
          console.warn('No customer email on booking; customer was not notified', {
            bookingId,
            bookingNumber: booking.booking_number,
          });
        }

        // Send admin notification. getAdminEmail() throws when neither
        // ADMIN_NOTIFICATION_EMAIL nor RESEND_FROM_EMAIL is set, and the booking has
        // already succeeded and deducted the wallet, so never let that surface.
        try {
          sends.push(sendNewBookingNotificationEmail({
            adminEmail: getAdminEmail(),
            bookingId: bookingId as string,
            bookingReference: booking.booking_number,
            tripNumber: booking.trip_number,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email || '',
            customerPhone: booking.customer_phone || 'Not provided',
            vehicleCategory: vehicle?.category?.name || 'Vehicle',
            vehicleType: vehicle?.name || undefined,
            pickupLocation,
            dropoffLocation,
            pickupDate,
            pickupTime,
            totalAmount: booking.total_price,
            currency,
            bookingDetailsUrl: `${getAppUrl()}/admin/bookings/${bookingId}`,
          }).catch((err: unknown) => {
            console.error('Failed to send admin booking notification email:', err);
          }));
        } catch (err: unknown) {
          console.error('Admin notification email not configured:', err);
        }

        await Promise.allSettled(sends);
      });
    }

    // Check for low balance and send alert if needed
    try {
      const { data: account } = await supabaseAdmin
        .from('business_accounts')
        .select('wallet_balance, currency, notification_preferences')
        .eq('id', user.businessAccountId)
        .single();

      if (account) {
        const preferences = account.notification_preferences || {};
        const lowBalanceConfig = preferences.low_balance_alert;

        // Check if low balance alert is enabled and balance is below threshold
        if (lowBalanceConfig?.enabled !== false) {
          const threshold = lowBalanceConfig?.threshold || 100; // Default threshold
          if (account.wallet_balance <= threshold) {
            // Get owner's auth_user_id for in-app notification
            const { data: ownerUser } = await supabaseAdmin
              .from('business_users')
              .select('auth_user_id')
              .eq('business_account_id', user.businessAccountId)
              .eq('role', 'owner')
              .single();

            // Send in-app notification
            if (ownerUser?.auth_user_id) {
              await supabaseAdmin.rpc('create_business_notification', {
                p_business_user_auth_id: ownerUser.auth_user_id,
                p_category: 'payment',
                p_type: 'low_balance_alert',
                p_title: 'Low Wallet Balance',
                p_message: `Your wallet balance is ${account.wallet_balance} ${account.currency || 'AED'}. Consider adding funds to avoid service interruption.`,
                p_data: {
                  current_balance: account.wallet_balance,
                  threshold,
                  currency: account.currency || 'AED',
                },
                p_link: '/business/wallet',
              });
            }

            // Send email notification via internal API
            // getAppUrl(), not the bare env var: unset, `${process.env.NEXT_PUBLIC_APP_URL}`
            // interpolates to the string "undefined" and fetch throws on the URL, which the
            // catch below then swallows.
            //
            // Keep this absolute and pinned to the platform origin. /api/internal/* is
            // outside the custom-domain allowlist in lib/business/domain-routing.ts, so a
            // relative URL would be answered with a 307 to /business/login by proxy.ts and
            // fail as a 200 with an HTML body.
            await fetch(`${getAppUrl()}/api/internal/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                notification_type: 'low_balance_alert',
                business_account_id: user.businessAccountId,
                email_data: {
                  threshold,
                },
              }),
            });
          }
        }
      }
    } catch (alertError) {
      // Don't fail the booking if alert fails - just log
      console.error('Failed to send low balance alert:', alertError);
    }

    return apiSuccess(
      {
        id: bookingId,
        booking_number: booking?.booking_number,
        message: 'Booking created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Booking API error:', error);
    return apiError('Failed to create booking', 500);
  }
});
