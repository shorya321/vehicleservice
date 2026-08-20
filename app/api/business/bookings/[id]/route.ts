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
import { notifyBusinessBookingCancelled } from '@/lib/business/email/notify';
import { getAppUrl } from '@/lib/business/email/platform';
import {
  buildBusinessSideRecipients,
  loadBookingCreatorById,
} from '@/lib/business/email/recipients';
import { getBookingTimezone } from '@/lib/business/utils/timezone';
import { hasActiveVendorAssignment } from '@/lib/business/bookings/active-assignments';
import { activityLogger } from '@/lib/business/activity/log';

/**
 * DELETE /api/business/bookings/[id]
 * Delete a booking permanently (with refund if applicable)
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
      // Fetch booking to verify ownership, get refund info, and capture details for notifications
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

      // Notify BEFORE deletion (the row's data won't exist after).
      //
      // None of this used to run unless the booking had a passenger address: the whole
      // block, including the owner's in-app notification, sat inside a customer_email
      // guard, so deleting a booking entered without one told nobody anything. Only the
      // passenger send is conditional now.
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name, business_email, currency, wallet_balance')
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

      // Not awaited, and wrapped in after() because a tenant's own SMTP server is a
      // multi round-trip conversation against a host of unknown latency. Without it the
      // promise is frequently dropped when the serverless instance freezes after the
      // response, and the mail is silently lost under load.
      after(async () => {
        // Deletion moves no money, so refundAmount is 0 and the balance is unchanged. The
        // template drops its "credited back to your wallet" note when nothing was
        // refunded, so this does not claim a refund that did not happen.
        const recipients = buildBusinessSideRecipients({
          ownerEmail: businessAccount?.business_email ?? null,
          ownerName: businessAccount?.business_name ?? null,
          creator: await loadBookingCreatorById(booking.created_by_user_id),
          actorMemberId: user.businessId,
        });

        notifyBusinessBookingCancelled(recipients, {
          businessAccountId: user.businessAccountId,
          businessName: businessAccount?.business_name || 'Your booking provider',
          bookingNumber: booking.booking_number,
          tripNumber: booking.trip_number,
          customerName: booking.customer_name,
          pickupLocation,
          dropoffLocation,
          pickupDateTime,
          cancellationReason: 'Booking deleted. No refund is issued on deletion.',
          refundAmount: 0,
          newBalance: Number(businessAccount?.wallet_balance ?? 0),
          currency: businessAccount?.currency || 'AED',
          walletUrl: `${getAppUrl()}/business/wallet`,
        }).catch((err: unknown) => {
          console.error('Failed to send business deletion email:', err);
        });

        if (booking.customer_email) {
          sendBusinessCustomerBookingCancelledEmail({
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

      // Create in-app notification for business user
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
          p_type: 'booking_deleted',
          p_title: `Booking Deleted - #${booking.trip_number || booking.booking_number}`,
          p_message: `Booking for ${booking.customer_name} deleted. No refund is issued on deletion. Cancel a booking to release its refund.`,
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

      // Delete the booking
      const { error: deleteError } = await supabaseAdmin
        .from('business_bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error('Delete booking error:', deleteError);

        // A booking created from a quotation is protected by an ON DELETE RESTRICT foreign key,
        // which surfaces here as 23503. Without this it reads as a generic server error.
        if (deleteError.code === '23503') {
          return apiError(
            'This booking was created from a quotation. Remove it from that quotation before deleting.',
            409
          );
        }

        return apiError('Failed to delete booking', 500);
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
