/**
 * Bulk Delete Bookings API
 * Handle deletion of multiple bookings at once
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  requireBusinessOwner,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { sendBusinessCustomerBookingCancelledEmail } from '@/lib/email/services/business-emails';
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone';

const bulkDeleteSchema = z.object({
  booking_ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/business/bookings/bulk-delete
 * Delete multiple bookings permanently (with refunds if applicable)
 */
export const POST = requireBusinessOwner(
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
      // Fetch all bookings to verify ownership, get refund info, and capture details for notifications
      const { data: bookings, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select(`
          id, business_account_id, booking_status, wallet_deduction_amount,
          booking_number, trip_number, customer_name, customer_email,
          pickup_address, dropoff_address, pickup_datetime,
          from_location:from_location_id(name),
          to_location:to_location_id(name)
        `)
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

      // Deleting NEVER moves money — refunds belong to cancellation alone, under the published
      // 24-hour policy. This previously issued one aggregate refund through an RPC named
      // `add_wallet_balance` that has never existed (the real one is `add_to_wallet`), logged
      // the failure, deleted anyway, and still reported `total_refund`. It also omitted
      // 'completed' from its guard, so a corrected call would have refunded delivered trips.

      // Send customer cancellation emails BEFORE deletion (fire-and-forget)
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name, currency')
        .eq('id', user.businessAccountId)
        .single();

      const businessName = businessAccount?.business_name || 'Your booking provider';

      Promise.allSettled(
        bookings
          .filter((b) => b.customer_email)
          .map((b) => {
            const pickupLocation = (b as any).from_location?.name
              ? `${(b as any).from_location.name}${b.pickup_address ? ` - ${b.pickup_address}` : ''}`
              : b.pickup_address || 'N/A';

            const dropoffLocation = (b as any).to_location?.name
              ? `${(b as any).to_location.name}${b.dropoff_address ? ` - ${b.dropoff_address}` : ''}`
              : b.dropoff_address || 'N/A';

            const pickupDateTime = new Date(b.pickup_datetime).toLocaleString('en-US', {
              timeZone: BOOKING_TIMEZONE,
              dateStyle: 'full',
              timeStyle: 'short',
            });

            return sendBusinessCustomerBookingCancelledEmail({
              customerName: b.customer_name,
              customerEmail: b.customer_email,
              businessName,
              bookingNumber: b.booking_number,
              tripNumber: b.trip_number,
              pickupLocation,
              dropoffLocation,
              pickupDateTime,
            });
          })
      ).catch((err) => console.error('Bulk deletion email error:', err));

      // Delete all bookings
      const bookingIdsToDelete = bookings.map((b) => b.id);
      const { error: deleteError } = await supabaseAdmin
        .from('business_bookings')
        .delete()
        .in('id', bookingIdsToDelete);

      if (deleteError) {
        console.error('Bulk delete error:', deleteError);

        // At least one booking came from a quotation and is held by an ON DELETE RESTRICT
        // foreign key. Nothing was deleted — the statement is all-or-nothing.
        if (deleteError.code === '23503') {
          return apiError(
            'One or more of these bookings was created from a quotation. Remove them from their quotation before deleting.',
            409
          );
        }

        return apiError('Failed to delete bookings', 500);
      }

      return apiSuccess({
        message: `Successfully deleted ${bookings.length} booking(s)`,
        deleted_count: bookings.length,
        // Deletion never refunds — see the note above.
        refunded: false,
      });
    } catch (error) {
      console.error('Bulk delete API error:', error);
      return apiError('Failed to delete bookings', 500);
    }
  }
);
