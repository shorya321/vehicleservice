/**
 * Cancel Booking API
 * Handle booking cancellation with automatic refund
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { bookingCancellationSchema } from '@/lib/business/validators';
import {
  BUSINESS_BASE_CURRENCY,
  convertFromAed,
  formatCurrency,
} from '@/lib/business/wallet-operations';
import { getExchangeRates } from '@/lib/currency/server';
import { getAppUrl } from '@/lib/email/config';
import {
  sendBusinessBookingCancellationEmail,
  sendBusinessCustomerBookingCancelledEmail,
} from '@/lib/email/services/business-emails';

/**
 * POST /api/business/bookings/[id]/cancel
 * Cancel booking and refund to wallet atomically
 */
export const POST = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const bookingId = id;

    // Parse and validate request body
    const body = await parseRequestBody(request, bookingCancellationSchema);

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
      // Verify booking belongs to this business
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select('business_account_id, booking_status')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return apiError('Booking not found', 404);
      }

      if (booking.business_account_id !== user.businessAccountId) {
        return apiError('Unauthorized', 403);
      }

      // Call atomic cancellation function
      const { data: result, error } = await supabaseAdmin.rpc(
        'cancel_business_booking_with_refund',
        {
          p_booking_id: bookingId,
          p_cancellation_reason: body.cancellation_reason,
        }
      );

      if (error) {
        console.error('Booking cancellation error:', error);

        // Check for specific errors
        if (error.message.includes('Cannot cancel booking')) {
          return apiError(error.message, 400);
        }

        return apiError(error.message || 'Failed to cancel booking', 500);
      }

      // Extract refund details from result
      const refundAmount = result?.[0]?.refund_amount || 0;
      const newBalance = result?.[0]?.new_balance || 0;

      // Get booking details for email
      const { data: cancelledBooking } = await supabaseAdmin
        .from('business_bookings')
        .select(`
          booking_number,
          trip_number,
          customer_name,
          customer_email,
          pickup_address,
          dropoff_address,
          pickup_datetime,
          from_location:from_location_id(name),
          to_location:to_location_id(name)
        `)
        .eq('id', bookingId)
        .single();

      // Get business account details for email
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name, business_email, currency, preferred_currency')
        .eq('id', user.businessAccountId)
        .single();

      // Send cancellation emails and notification
      if (cancelledBooking && businessAccount) {
        const pickupLocation = (cancelledBooking as any).from_location?.name
          ? `${(cancelledBooking as any).from_location.name}${cancelledBooking.pickup_address ? ` - ${cancelledBooking.pickup_address}` : ''}`
          : cancelledBooking.pickup_address || 'N/A';

        const dropoffLocation = (cancelledBooking as any).to_location?.name
          ? `${(cancelledBooking as any).to_location.name}${cancelledBooking.dropoff_address ? ` - ${cancelledBooking.dropoff_address}` : ''}`
          : cancelledBooking.dropoff_address || 'N/A';

        const pickupDateTime = new Date(cancelledBooking.pickup_datetime).toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        });

        // Refund and balance are AED. Render them in the business's preferred currency,
        // showing the AED figure actually refunded alongside.
        const displayCurrency = businessAccount.preferred_currency || BUSINESS_BASE_CURRENCY;
        const rates = await getExchangeRates();
        const toDisplay = (aed: number) => convertFromAed(aed, displayCurrency, rates);
        const isConverted = displayCurrency !== BUSINESS_BASE_CURRENCY;

        // Send cancellation email to business owner
        sendBusinessBookingCancellationEmail({
          email: businessAccount.business_email,
          businessName: businessAccount.business_name,
          bookingNumber: cancelledBooking.booking_number,
          tripNumber: cancelledBooking.trip_number,
          customerName: cancelledBooking.customer_name,
          pickupLocation,
          dropoffLocation,
          pickupDateTime,
          cancellationReason: body.cancellation_reason,
          refundAmount: toDisplay(refundAmount),
          newBalance: toDisplay(newBalance),
          currency: displayCurrency,
          originalAmount: isConverted ? refundAmount : undefined,
          originalCurrency: isConverted ? BUSINESS_BASE_CURRENCY : undefined,
          walletUrl: `${getAppUrl()}/business/wallet`,
        }).catch((err: unknown) => {
          console.error('Failed to send business cancellation email:', err);
        });

        // Send cancellation email to customer
        if (cancelledBooking.customer_email) {
          sendBusinessCustomerBookingCancelledEmail({
            customerName: cancelledBooking.customer_name,
            customerEmail: cancelledBooking.customer_email,
            businessName: businessAccount.business_name,
            bookingNumber: cancelledBooking.booking_number,
            tripNumber: cancelledBooking.trip_number,
            pickupLocation,
            dropoffLocation,
            pickupDateTime,
            cancellationReason: body.cancellation_reason,
          }).catch((err: unknown) => {
            console.error('Failed to send customer cancellation email:', err);
          });
        }

        // Create in-app notification with refund details
        const { data: ownerUser } = await supabaseAdmin
          .from('business_users')
          .select('auth_user_id')
          .eq('business_account_id', user.businessAccountId)
          .eq('role', 'owner')
          .single();

        if (ownerUser?.auth_user_id) {
          supabaseAdmin.rpc('create_business_notification', {
            p_business_user_auth_id: ownerUser.auth_user_id,
            p_category: 'booking',
            p_type: 'booking_cancelled_refund',
            p_title: `Booking Cancelled - #${cancelledBooking.trip_number || cancelledBooking.booking_number}`,
            p_message: `Booking for ${cancelledBooking.customer_name} cancelled. ${businessAccount.currency || 'AED'} ${refundAmount.toFixed(2)} refunded to wallet.`,
            p_data: {
              booking_number: cancelledBooking.booking_number,
              trip_number: cancelledBooking.trip_number,
              refund_amount: refundAmount,
              new_balance: newBalance,
              currency: businessAccount.currency || 'AED',
            },
            p_link: `/business/wallet`,
          }).then(({ error: notifError }) => {
            if (notifError) console.error('Failed to create cancellation notification:', notifError);
          });
        }
      }

      return apiSuccess({
        message: 'Booking cancelled successfully',
        refund_amount: formatCurrency(refundAmount),
        new_balance: formatCurrency(newBalance),
      });
    } catch (error) {
      console.error('Cancel booking API error:', error);
      return apiError('Failed to cancel booking', 500);
    }
  }
);
