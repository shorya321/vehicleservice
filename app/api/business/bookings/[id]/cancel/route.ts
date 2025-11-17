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
