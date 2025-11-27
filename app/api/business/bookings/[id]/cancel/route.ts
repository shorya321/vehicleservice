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
import { formatCurrency } from '@/lib/business/wallet-operations';
import { sendBusinessBookingCancellationEmail } from '@/lib/email/services/business-emails';

/**
 * POST /api/business/bookings/[id]/cancel
 * Cancel booking and refund to wallet atomically
 */
export const POST = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: { id: string } }) => {
    const bookingId = context.params.id;

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
          customer_name,
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
        .select('business_name, business_email, currency')
        .eq('id', user.businessAccountId)
        .single();

      // Send cancellation email
      if (cancelledBooking && businessAccount) {
        try {
          const pickupLocation = cancelledBooking.from_location?.name
            ? `${cancelledBooking.from_location.name}${cancelledBooking.pickup_address ? ` - ${cancelledBooking.pickup_address}` : ''}`
            : cancelledBooking.pickup_address || 'N/A';

          const dropoffLocation = cancelledBooking.to_location?.name
            ? `${cancelledBooking.to_location.name}${cancelledBooking.dropoff_address ? ` - ${cancelledBooking.dropoff_address}` : ''}`
            : cancelledBooking.dropoff_address || 'N/A';

          const pickupDateTime = new Date(cancelledBooking.pickup_datetime).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          });

          await sendBusinessBookingCancellationEmail({
            email: businessAccount.business_email,
            businessName: businessAccount.business_name,
            bookingNumber: cancelledBooking.booking_number,
            customerName: cancelledBooking.customer_name,
            pickupLocation,
            dropoffLocation,
            pickupDateTime,
            cancellationReason: body.cancellation_reason,
            refundAmount,
            newBalance,
            currency: businessAccount.currency || 'USD',
            walletUrl: `${process.env.NEXT_PUBLIC_APP_URL}/business/wallet`,
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
          // Don't fail the cancellation if email fails
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
