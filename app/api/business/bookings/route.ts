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
import { sendBusinessBookingConfirmationEmail } from '@/lib/email/services/business-emails';

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
        p_luggage_count: body.luggage_count,
        p_base_price: body.base_price,
        p_amenities_price: body.amenities_price,
        p_total_price: body.total_price,
        p_customer_notes: body.customer_notes || null,
        p_reference_number: body.reference_number || null,
      }
    );

    if (error) {
      console.error('Booking creation error:', error);

      // Check for insufficient balance error
      if (error.message.includes('Insufficient wallet balance')) {
        return apiError('Insufficient wallet balance. Please add credits.', 402);
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
            const currency = account?.currency || 'USD';

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
                  rejected_amount: body.total_price,
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
                  rejectedTransactionAmount: body.total_price,
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

    // Get the created booking details with related data
    const { data: booking } = await supabaseAdmin
      .from('business_bookings')
      .select(`
        id,
        booking_number,
        customer_name,
        customer_phone,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        total_price,
        reference_number,
        passenger_count,
        vehicle_types:vehicle_type_id(name),
        from_location:from_location_id(name),
        to_location:to_location_id(name)
      `)
      .eq('id', bookingId)
      .single();

    // Get business account details for email
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('business_name, business_email, wallet_balance, currency')
      .eq('id', user.businessAccountId)
      .single();

    // Send booking confirmation email
    if (booking && businessAccount) {
      try {
        const pickupLocation = booking.from_location?.name
          ? `${booking.from_location.name}${booking.pickup_address ? ` - ${booking.pickup_address}` : ''}`
          : booking.pickup_address || 'N/A';

        const dropoffLocation = booking.to_location?.name
          ? `${booking.to_location.name}${booking.dropoff_address ? ` - ${booking.dropoff_address}` : ''}`
          : booking.dropoff_address || 'N/A';

        const pickupDateTime = new Date(booking.pickup_datetime).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });

        await sendBusinessBookingConfirmationEmail({
          email: businessAccount.business_email,
          businessName: businessAccount.business_name,
          bookingNumber: booking.booking_number,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          pickupLocation,
          dropoffLocation,
          pickupDateTime,
          vehicleType: booking.vehicle_types?.name || 'Standard',
          passengerCount: booking.passenger_count,
          totalPrice: booking.total_price,
          currency: businessAccount.currency || 'USD',
          walletDeducted: booking.total_price,
          newBalance: businessAccount.wallet_balance,
          bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/business/bookings/${booking.id}`,
          referenceNumber: booking.reference_number,
        });
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
        // Don't fail the booking if email fails
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
                p_message: `Your wallet balance is ${account.wallet_balance} ${account.currency || 'USD'}. Consider adding funds to avoid service interruption.`,
                p_data: {
                  current_balance: account.wallet_balance,
                  threshold,
                  currency: account.currency || 'USD',
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
