/**
 * Business Bookings API
 * Create and manage business bookings
 */

import { NextRequest } from 'next/server';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { bookingCreationSchema } from '@/lib/business/validators';
import { createClient } from '@supabase/supabase-js';
import {
  sendBusinessBookingConfirmationEmail,
  sendBusinessCustomerBookingConfirmationEmail,
} from '@/lib/email/services/business-emails';
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails';
import { getAdminEmail, getAppUrl } from '@/lib/email/config';
import { getExchangeRates } from '@/lib/currency/server';
import { BUSINESS_BASE_CURRENCY, convertFromAed } from '@/lib/business/wallet-operations';
import { verifyBusinessQuoteSignature } from '@/lib/security/booking-hmac';
import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation';
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone';

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
    selectedAddons: body.selected_addons?.map((a) => ({
      addon_id: a.addon_id,
      quantity: a.quantity,
    })),
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
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
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
      }));

      const { error: addonsError } = await supabaseAdmin
        .from('business_booking_addons')
        .insert(addonRecords);

      if (addonsError) {
        console.error('Failed to save booking addons:', addonsError);
        // Don't fail the booking, addons are supplementary
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
        timeZone: BOOKING_TIMEZONE,
        dateStyle: 'full',
        timeStyle: 'short',
      });

      // The admin template takes date and time as separate rows.
      const pickupDate = new Date(booking.pickup_datetime).toLocaleDateString('en-US', {
        timeZone: BOOKING_TIMEZONE,
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const pickupTime = new Date(booking.pickup_datetime).toLocaleTimeString('en-US', {
        timeZone: BOOKING_TIMEZONE,
        hour: '2-digit', minute: '2-digit',
      });

      // Prices, the wallet and the Stripe charge are all denominated in AED.
      const currency = BUSINESS_BASE_CURRENCY;

      const extras = priceResult.verifiedAddons.map((addon) => ({
        label: addon.name,
        quantity: addon.quantity,
        price: addon.total_price,
      }));

      // The owner email is rendered in the business's preferred currency, with the AED
      // figure actually charged shown alongside. The admin email stays AED (below).
      const displayCurrency = businessAccount.preferred_currency || BUSINESS_BASE_CURRENCY;
      const rates = await getExchangeRates();
      const toDisplay = (aed: number) => convertFromAed(aed, displayCurrency, rates);
      const isConverted = displayCurrency !== BUSINESS_BASE_CURRENCY;
      const extrasForOwner = extras.map((e) => ({ ...e, price: toDisplay(e.price) }));

      // Send confirmation to business owner
      sendBusinessBookingConfirmationEmail({
        email: businessAccount.business_email,
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
      });

      // Send confirmation to customer
      if (booking.customer_email) {
        sendBusinessCustomerBookingConfirmationEmail({
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
        });
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
        sendNewBookingNotificationEmail({
          adminEmail: getAdminEmail(),
          bookingId: bookingId as string,
          bookingReference: booking.booking_number,
          tripNumber: booking.trip_number,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email || '',
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
        });
      } catch (err: unknown) {
        console.error('Admin notification email not configured:', err);
      }
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
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
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
