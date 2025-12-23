/**
 * Single Booking API
 * Handle single booking operations (GET, DELETE)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
} from '@/lib/business/api-utils';

/**
 * DELETE /api/business/bookings/[id]
 * Delete a booking permanently (with refund if applicable)
 */
export const DELETE = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: { id: string } }) => {
    const bookingId = context.params.id;

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
      // Fetch booking to verify ownership and get refund info
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select('id, business_account_id, booking_status, wallet_deduction_amount')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return apiError('Booking not found', 404);
      }

      if (booking.business_account_id !== user.businessAccountId) {
        return apiError('Unauthorized', 403);
      }

      // If booking has wallet deduction and is not already cancelled/refunded, refund first
      const needsRefund =
        booking.wallet_deduction_amount > 0 &&
        !['cancelled', 'refunded'].includes(booking.booking_status);

      if (needsRefund) {
        // Refund the wallet amount
        const { error: refundError } = await supabaseAdmin.rpc(
          'add_wallet_balance',
          {
            p_business_account_id: user.businessAccountId,
            p_amount: booking.wallet_deduction_amount,
            p_transaction_type: 'refund',
            p_description: `Refund for deleted booking`,
            p_reference_id: bookingId,
          }
        );

        if (refundError) {
          console.error('Refund error during delete:', refundError);
          // Continue with deletion even if refund fails
        }
      }

      // Delete the booking
      const { error: deleteError } = await supabaseAdmin
        .from('business_bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error('Delete booking error:', deleteError);
        return apiError('Failed to delete booking', 500);
      }

      return apiSuccess({
        message: 'Booking deleted successfully',
        refunded: needsRefund,
        refund_amount: needsRefund ? booking.wallet_deduction_amount : 0,
      });
    } catch (error) {
      console.error('Delete booking API error:', error);
      return apiError('Failed to delete booking', 500);
    }
  }
);
