/**
 * Bulk Delete Bookings API
 * Handle deletion of multiple bookings at once
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';

const bulkDeleteSchema = z.object({
  booking_ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/business/bookings/bulk-delete
 * Delete multiple bookings permanently (with refunds if applicable)
 */
export const POST = requireBusinessAuth(
  async (request: NextRequest, user) => {
    // Parse and validate request body
    const body = await parseRequestBody(request, bulkDeleteSchema);

    if (!body) {
      return apiError('Invalid request body. Provide an array of booking IDs.', 400);
    }

    const { booking_ids } = body;

    // Use admin client
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
      // Fetch all bookings to verify ownership and get refund info
      const { data: bookings, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select('id, business_account_id, booking_status, wallet_deduction_amount')
        .in('id', booking_ids);

      if (fetchError) {
        console.error('Fetch bookings error:', fetchError);
        return apiError('Failed to fetch bookings', 500);
      }

      if (!bookings || bookings.length === 0) {
        return apiError('No bookings found', 404);
      }

      // Verify all bookings belong to this business
      const unauthorizedBookings = bookings.filter(
        (b) => b.business_account_id !== user.businessAccountId
      );

      if (unauthorizedBookings.length > 0) {
        return apiError('Unauthorized: Some bookings do not belong to your account', 403);
      }

      // Calculate total refund amount
      let totalRefund = 0;
      const bookingsNeedingRefund = bookings.filter((b) => {
        const needsRefund =
          b.wallet_deduction_amount > 0 &&
          !['cancelled', 'refunded'].includes(b.booking_status);
        if (needsRefund) {
          totalRefund += b.wallet_deduction_amount;
        }
        return needsRefund;
      });

      // Process refunds if needed
      if (totalRefund > 0) {
        const { error: refundError } = await supabaseAdmin.rpc(
          'add_wallet_balance',
          {
            p_business_account_id: user.businessAccountId,
            p_amount: totalRefund,
            p_transaction_type: 'refund',
            p_description: `Bulk refund for ${bookingsNeedingRefund.length} deleted booking(s)`,
            p_reference_id: null,
          }
        );

        if (refundError) {
          console.error('Bulk refund error:', refundError);
          // Continue with deletion even if refund fails
        }
      }

      // Delete all bookings
      const bookingIdsToDelete = bookings.map((b) => b.id);
      const { error: deleteError } = await supabaseAdmin
        .from('business_bookings')
        .delete()
        .in('id', bookingIdsToDelete);

      if (deleteError) {
        console.error('Bulk delete error:', deleteError);
        return apiError('Failed to delete bookings', 500);
      }

      return apiSuccess({
        message: `Successfully deleted ${bookings.length} booking(s)`,
        deleted_count: bookings.length,
        refunded_count: bookingsNeedingRefund.length,
        total_refund: totalRefund,
      });
    } catch (error) {
      console.error('Bulk delete API error:', error);
      return apiError('Failed to delete bookings', 500);
    }
  }
);
