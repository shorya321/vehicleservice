/**
 * Bulk Delete Bookings API
 * Handle deletion of multiple bookings at once
 */

import { NextRequest, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  requireBusinessOwner,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { sendBusinessCustomerBookingCancelledEmail } from '@/lib/business/email/services/business-emails';
import { getBookingTimezone } from '@/lib/business/utils/timezone';
import { isActiveBookingStatus } from '@/lib/business/booking-utils';
import { logBusinessActivityBatch } from '@/lib/business/activity/log';
import { findBookingsWithActiveAssignment } from '@/lib/business/bookings/active-assignments';
import { expandToWholeBusinessTrips } from '@/lib/business/trips/delete-server';
import { blockedQuotationTrips, moveBusinessTripsToTrash } from '@/lib/business/trips/trash-server';
import { businessPortalDeleteBlockedReason } from '@/lib/business/booking-guards';

const bulkDeleteSchema = z.object({
  booking_ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * POST /api/business/bookings/bulk-delete
 * Move multiple bookings to the trash (restorable for 30 days)
 */
export const POST = requireBusinessOwner(
  async (request: NextRequest, user) => {
    // Parse and validate request body
    const body = await parseRequestBody(request, bulkDeleteSchema);

    if (!body) {
      return apiError('Invalid request body. Provide an array of booking IDs.', 400);
    }

    const requestedIds = body.booking_ids;

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
      // Journeys of a round trip or multi-city trip go together, so the request is widened to
      // the whole trip. One-way and hourly ids come back unchanged.
      const expanded = await expandToWholeBusinessTrips(supabaseAdmin, requestedIds, user.businessAccountId);
      if (expanded.error) {
        return apiError('Unable to verify these bookings right now. Please try again.', 503);
      }
      const booking_ids = expanded.ids;

      // Fetch all bookings to verify ownership, get refund info, and capture details for notifications
      const { data: bookings, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select(`
          id, business_account_id, booking_status, payment_status, wallet_deduction_amount,
          booking_number, trip_number, customer_name, customer_email,
          pickup_address, dropoff_address, pickup_datetime, created_by_user_id, booking_group_id,
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

      // Deleting never refunds, so upcoming paid bookings are cancelled, not deleted. Named, all or
      // nothing, like the checks below.
      const awaitingRefund = bookings.filter(
        (b) => b.booking_status === 'cancelled' && businessPortalDeleteBlockedReason(b) !== null
      );
      if (awaitingRefund.length > 0) {
        const names = awaitingRefund.map((b) => b.trip_number || b.booking_number).join(', ');
        return apiError(
          `${names} ${awaitingRefund.length === 1 ? 'is' : 'are'} cancelled and waiting for the platform team to review a refund. Deselect ${
            awaitingRefund.length === 1 ? 'it' : 'them'
          } and try again.`,
          409
        );
      }
      const liveBookings = bookings.filter((b) => businessPortalDeleteBlockedReason(b) !== null);
      if (liveBookings.length > 0) {
        const names = liveBookings.map((b) => b.trip_number || b.booking_number).join(', ');
        return apiError(
          `${names} ${liveBookings.length === 1 ? 'is' : 'are'} still upcoming. Cancel ${
            liveBookings.length === 1 ? 'it' : 'them'
          } first, or deselect and try again. If a booking can no longer be cancelled here, contact support.`,
          409
        );
      }

      // Bookings a vendor is on cannot be deleted from the portal. All or
      // nothing, matching the ownership check above and the single `.in()`
      // delete below: a partial delete would leave the caller guessing which of
      // their selection survived.
      const { assignedIds, error: assignmentError } = await findBookingsWithActiveAssignment(
        supabaseAdmin,
        bookings.map((b) => b.id)
      );

      // Fail closed. An unreadable assignments table is not a reason to allow an
      // irreversible bulk delete.
      if (assignmentError) {
        return apiError('Unable to verify these bookings right now. Please try again.', 503);
      }

      if (assignedIds.size > 0) {
        // Named, because the caller selected these by checkbox and otherwise has
        // no way to tell which ones to deselect.
        const blocked = bookings
          .filter((b) => assignedIds.has(b.id))
          .map((b) => b.trip_number || b.booking_number)
          .join(', ');

        return apiError(
          `A vehicle has already been assigned to ${blocked}. Deselect ${
            assignedIds.size === 1 ? 'it' : 'those'
          } and try again, or contact support.`,
          403
        );
      }

      // Quotation trips may go to the trash once every journey is cancelled; the trash keeps
      // their quotation line locked. Checked up front and named, because the move below is all
      // or nothing and the caller picked these by checkbox.
      const quotationCheck = await blockedQuotationTrips(supabaseAdmin, bookings);

      // Fail closed, same reasoning as the assignment guard above.
      if (quotationCheck.error) {
        return apiError('Unable to verify these bookings right now. Please try again.', 503);
      }

      if (quotationCheck.blocked.length > 0) {
        return apiError(
          `${quotationCheck.blocked.join(', ')} ${
            quotationCheck.blocked.length === 1 ? 'was' : 'were'
          } created from a quotation and still ${
            quotationCheck.blocked.length === 1 ? 'has' : 'have'
          } a journey that is not cancelled. Cancel every journey or deselect and try again.`,
          409
        );
      }

      // Deleting NEVER moves money. Neither does cancelling any more: refunds are
      // reviewed and issued by the platform team. This previously issued one
      // aggregate refund through an RPC named
      // `add_wallet_balance` that has never existed (the real one is `add_to_wallet`), logged
      // the failure, deleted anyway, and still reported `total_refund`. It also omitted
      // 'completed' from its guard, so a corrected call would have refunded delivered trips.

      // Read the account details NOW, while the rows still exist, but send
      // nothing until the delete below has actually succeeded.
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name')
        .eq('id', user.businessAccountId)
        .single();

      const businessName = businessAccount?.business_name || 'Your booking provider';

      // Logged BEFORE the delete: the rows are still readable, and the AFTER
      // DELETE trigger skips any booking that already has an entry. One row per
      // booking so the trigger sees each id, all sharing a batch id so the feed
      // collapses them into a single "deleted N bookings" entry.
      const batchId = crypto.randomUUID();
      // Trip numbers, to match the identifier the feed sentence now uses.
      // COALESCE onto the booking number for pre-20260611 rows that have none.
      const allRefs = bookings.map((b) => b.trip_number || b.booking_number).filter(Boolean);
      await logBusinessActivityBatch(
        bookings.map((b) => ({
          businessAccountId: user.businessAccountId,
          action: 'booking.bulk_deleted' as const,
          actor: {
            type: 'business_user' as const,
            name: user.memberName || user.memberEmail || undefined,
            authUserId: user.userId,
            businessUserId: user.businessId,
            role: user.role,
            email: user.memberEmail,
          },
          entity: { id: b.id, label: b.booking_number },
          amount: b.wallet_deduction_amount,
          currency: 'AED',
          requestId: batchId,
          metadata: {
            batch_id: batchId,
            count: bookings.length,
            refs: allRefs,
            customer_name: b.customer_name,
            previous_status: b.booking_status,
            // Bulk delete has never issued refunds either.
            refund_issued: false,
          },
        }))
      );

      // Move every trip to the trash in one transaction. All or nothing, like the checks above.
      const trashed = await moveBusinessTripsToTrash(
        supabaseAdmin,
        bookings.map((b) => b.id),
        user
      );
      if ('error' in trashed) {
        return apiError(trashed.error === 'Booking not found' ? 'No bookings found' : trashed.error, trashed.status);
      }

      const deleted = bookings;

      // -----------------------------------------------------------------------
      // Past this line the rows are gone. Only now does anyone get told, and only
      // about the rows Postgres actually removed.
      //
      // after(): these run past the response, which matters now that a tenant's own
      // SMTP server may be a multi round-trip conversation. Un-awaited, the promises
      // would be abandoned when the serverless instance froze and a whole batch of
      // emails would vanish with no error anywhere.
      // -----------------------------------------------------------------------
      after(async () => {
        await Promise.allSettled(
          deleted
            // The passenger hears about a deletion only when it takes a live trip
            // away from them. Deleting a booking that is already cancelled or
            // completed used to send a second "your transfer has been cancelled"
            // to someone who had already been told once.
            //
            // No business-side email either: deleting is an internal tidy-up, and
            // the owner gets the notification below plus the activity feed row.
            .filter((b) => isActiveBookingStatus(b.booking_status) && b.customer_email)
            .map((b) => {
              const pickupLocation = (b as any).from_location?.name
                ? `${(b as any).from_location.name}${b.pickup_address ? ` - ${b.pickup_address}` : ''}`
                : b.pickup_address || 'N/A';

              const dropoffLocation = (b as any).to_location?.name
                ? `${(b as any).to_location.name}${b.dropoff_address ? ` - ${b.dropoff_address}` : ''}`
                : b.dropoff_address || 'N/A';

              const pickupDateTime = new Date(b.pickup_datetime).toLocaleString('en-US', {
                timeZone: getBookingTimezone(),
                dateStyle: 'full',
                timeStyle: 'short',
              });

              return sendBusinessCustomerBookingCancelledEmail({
                businessAccountId: user.businessAccountId,
                customerName: b.customer_name,
                customerEmail: b.customer_email!,
                businessName,
                bookingNumber: b.booking_number,
                tripNumber: b.trip_number,
                pickupLocation,
                dropoffLocation,
                pickupDateTime,
              });
            })
        ).catch((err) => console.error('Bulk deletion email error:', err));
      });

      // The owner's bell. This route is owner-only, so the actor IS the owner and
      // would only be telling themselves what they just did - which is why the
      // single-booking route notifies and this one deliberately does not. The
      // activity feed carries the batch for everyone else.

      return apiSuccess({
        message: `Moved ${deleted.length} booking(s) to the trash`,
        deleted_count: deleted.length,
        // Deletion never refunds. See the note above.
        refunded: false,
      });
    } catch (error) {
      console.error('Bulk delete API error:', error);
      return apiError('Failed to delete bookings', 500);
    }
  }
);
