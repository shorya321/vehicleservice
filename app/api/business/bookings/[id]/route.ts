/**
 * Single Booking API
 * Handle single booking operations (GET, DELETE)
 */

import { NextRequest, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
} from '@/lib/business/api-utils';
import { sendBusinessCustomerBookingCancelledEmail } from '@/lib/business/email/services/business-emails';
import { getBookingTimezone } from '@/lib/business/utils/timezone';
import { hasActiveVendorAssignment } from '@/lib/business/bookings/active-assignments';
import { isActiveBookingStatus } from '@/lib/business/booking-utils';
import { activityLogger } from '@/lib/business/activity/log';

/**
 * DELETE /api/business/bookings/[id]
 * Delete a booking permanently. Never moves money, and never emails anyone
 * until the row is actually gone.
 */
export const DELETE = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const bookingId = id;

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
      // Fetch booking to verify ownership and capture details for notifications
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select(`
          id, business_account_id, booking_status, wallet_deduction_amount,
          booking_number, trip_number, customer_name, customer_email,
          pickup_address, dropoff_address, pickup_datetime, created_by_user_id,
          from_location:from_location_id(name),
          to_location:to_location_id(name)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return apiError('Booking not found', 404);
      }

      if (booking.business_account_id !== user.businessAccountId) {
        return apiError('Unauthorized', 403);
      }

      // Staff may only delete bookings they created themselves.
      if (user.role !== 'owner' && booking.created_by_user_id !== user.businessId) {
        return apiError('Forbidden: you can only delete bookings you created', 403);
      }

      // A booking a vendor is on cannot be deleted from the portal, for the same
      // reason it cannot be cancelled - except worse. Deleting is a hard DELETE
      // that cascades the assignment away, so a driver would be left holding a
      // job with no booking behind it and nothing to tell them it had gone.
      const { assigned, error: assignmentError } = await hasActiveVendorAssignment(
        supabaseAdmin,
        bookingId
      );

      // Fail closed. An unreadable assignments table is not a reason to allow an
      // irreversible delete.
      if (assignmentError) {
        return apiError('Unable to verify this booking right now. Please try again.', 503);
      }

      if (assigned) {
        return apiError(
          'A vehicle has already been assigned to this booking. Contact support to remove it.',
          403
        );
      }

      // A booking converted from a quotation is held by an ON DELETE RESTRICT
      // foreign key and can never be deleted. That used to be discovered by
      // attempting the delete and reading 23503 off the failure - by which point
      // the passenger had already been emailed a cancellation for a booking that
      // is still sitting there. Checked up front now, before anything is sent.
      //
      // limit(1) on an array, not maybeSingle(): maybeSingle throws PGRST116 if
      // the unique index ever fails to hold, turning a clean 409 into a 503.
      const { data: quotationLinks, error: quotationLinkError } = await supabaseAdmin
        .from('business_quotation_items')
        .select('id')
        .eq('converted_booking_id', bookingId)
        .limit(1);

      // Fail closed, same reasoning as the assignment guard above.
      if (quotationLinkError) {
        return apiError('Unable to verify this booking right now. Please try again.', 503);
      }

      if (quotationLinks && quotationLinks.length > 0) {
        return apiError(
          'This booking was created from a quotation and cannot be deleted. Cancel it instead if the trip is not going ahead.',
          409
        );
      }

      // Deleting NEVER moves money. Neither does cancelling any more: refunds are
      // reviewed and issued by the platform team from the business account.
      //
      // This previously called an RPC named `add_wallet_balance` that has never existed in the
      // database. The real function is `add_to_wallet`. The error was logged, deletion
      // continued regardless, and the response still reported `refunded: true`, so the money
      // silently vanished. The guard was also wrong: it omitted 'completed', so once the call
      // was corrected it would have refunded already-delivered trips.
      //
      // Removing the refund entirely fixes both, and makes the ordering question moot: with no
      // money moving there is nothing to keep atomic with the delete.

      // Read the row's details NOW, while it still exists, but send nothing yet.
      // Everything below the delete depends on these locals, not on the row.
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name, business_email')
        .eq('id', user.businessAccountId)
        .single();

      const pickupLocation = (booking as any).from_location?.name
        ? `${(booking as any).from_location.name}${booking.pickup_address ? ` - ${booking.pickup_address}` : ''}`
        : booking.pickup_address || 'N/A';

      const dropoffLocation = (booking as any).to_location?.name
        ? `${(booking as any).to_location.name}${booking.dropoff_address ? ` - ${booking.dropoff_address}` : ''}`
        : booking.dropoff_address || 'N/A';

      const pickupDateTime = new Date(booking.pickup_datetime).toLocaleString('en-US', {
        timeZone: getBookingTimezone(),
        dateStyle: 'full',
        timeStyle: 'short',
      });

      // Whether the passenger still had a trip ahead of them. A booking that is
      // already cancelled or completed must NOT produce a second "your transfer
      // has been cancelled" - they were told once already, and telling them again
      // because someone tidied up the list is the bug this guards.
      const wasActive = isActiveBookingStatus(booking.booking_status);

      // Logged BEFORE the delete, for two reasons: the row data is still
      // readable here, and the AFTER DELETE trigger skips when a
      // booking.deleted row already exists for this id. This route uses the
      // service-role client, so auth.uid() is NULL inside that trigger and it
      // could not tell an owner from a platform admin. Logging here is what
      // attributes the deletion to the right person.
      await activityLogger(user, request)('booking.deleted', {
        entity: { id: bookingId, label: booking.booking_number },
        // The amount that was taken from the wallet and is NOT coming back.
        amount: booking.wallet_deduction_amount,
        currency: 'AED',
        metadata: {
          customer_name: booking.customer_name,
          previous_status: booking.booking_status,
          pickup_at: booking.pickup_datetime,
          // Deleting has never issued a refund. Say so rather than omit it.
          refund_issued: false,
        },
      });

      // Delete the booking. select('id') so a no-op delete is distinguishable
      // from a successful one: two clicks on a slow connection would otherwise
      // both report success and both mail the passenger.
      const { data: deletedRows, error: deleteError } = await supabaseAdmin
        .from('business_bookings')
        .delete()
        .eq('id', bookingId)
        .select('id');

      if (deleteError) {
        console.error('Delete booking error:', deleteError);

        // Kept as a race fallback only: the pre-flight check above catches this
        // before anything is sent. Reaching here means the booking was converted
        // to a quotation line in the moments since.
        if (deleteError.code === '23503') {
          return apiError(
            'This booking was created from a quotation and cannot be deleted. Cancel it instead if the trip is not going ahead.',
            409
          );
        }

        return apiError('Failed to delete booking', 500);
      }

      if (!deletedRows || deletedRows.length === 0) {
        // Someone else deleted it first. Their request sent the notifications.
        return apiError('Booking not found', 404);
      }

      // ---------------------------------------------------------------------
      // Past this line the booking is gone. Only now does anyone get told.
      //
      // Wrapped in after() because a tenant's own SMTP server is a multi
      // round-trip conversation against a host of unknown latency. Without it the
      // promise is frequently dropped when the serverless instance freezes after
      // the response, and the mail is silently lost under load.
      // ---------------------------------------------------------------------
      after(async () => {
        // The passenger hears about a deletion only when it takes a live trip
        // away from them. No business-side email at all: deleting is an internal
        // tidy-up, the owner gets the bell below and the activity feed row, and
        // reusing the cancellation email for it was what put "Booking Cancelled"
        // in owners' inboxes for a booking they had already cancelled.
        if (wasActive && booking.customer_email) {
          await sendBusinessCustomerBookingCancelledEmail({
            businessAccountId: user.businessAccountId,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            businessName: businessAccount?.business_name || 'Your booking provider',
            bookingNumber: booking.booking_number,
            tripNumber: booking.trip_number,
            pickupLocation,
            dropoffLocation,
            pickupDateTime,
          }).catch((err: unknown) => {
            console.error('Failed to send customer deletion email:', err);
          });
        }
      });

      // In-app notification for the owner, so a staff deletion does not go
      // unseen. Skipped when the owner is the one who clicked: nobody needs a
      // bell for their own action, which is the same rule the email layer
      // applies through buildBusinessSideRecipients.
      const { data: ownerUser } = await supabaseAdmin
        .from('business_users')
        .select('auth_user_id')
        .eq('business_account_id', user.businessAccountId)
        .eq('role', 'owner')
        .single();

      if (ownerUser?.auth_user_id && ownerUser.auth_user_id !== user.userId) {
        supabaseAdmin.rpc('create_business_notification', {
          p_business_user_auth_id: ownerUser.auth_user_id,
          p_category: 'booking',
          p_type: 'booking_deleted',
          p_title: `Booking Deleted - #${booking.trip_number || booking.booking_number}`,
          // No "cancel to release its refund" any more. Cancelling releases
          // nothing either: refunds are reviewed and issued by the platform team.
          p_message: `Booking for ${booking.customer_name} deleted. No refund is issued on deletion.`,
          p_data: {
            booking_number: booking.booking_number,
            trip_number: booking.trip_number,
            refunded: false,
          },
          p_link: '/business/bookings',
        }).then(({ error: notifError }) => {
          if (notifError) console.error('Failed to create deletion notification:', notifError);
        });
      }

      return apiSuccess({
        message: 'Booking deleted successfully',
        // Deletion never refunds. See the note above. Reported explicitly so no caller infers
        // otherwise, as the previous response wrongly did.
        refunded: false,
      });
    } catch (error) {
      console.error('Delete booking API error:', error);
      return apiError('Failed to delete booking', 500);
    }
  }
);
