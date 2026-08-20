/**
 * Cancel Booking API
 *
 * Cancels a business booking. Deliberately moves no money: the wallet deduction
 * stays where it is and a refund, if one is due, is issued by the platform team
 * from the business account. Cancelling used to return the full amount whenever
 * pickup was more than 24h out, with nobody reviewing it.
 */

import { NextRequest, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { bookingCancellationSchema } from '@/lib/business/validators';
import { getCancellationEligibility } from '@/lib/business/booking-utils';
import { loadCancellationWindowMinutes } from '@/lib/business/utils/cancellation-settings';
import { closeActiveAssignments } from '@/lib/bookings/unified-service';
import {
  BUSINESS_BASE_CURRENCY,
  convertFromAed,
  formatCurrency,
} from '@/lib/business/wallet-operations';
import { getExchangeRates } from '@/lib/currency/server';
import { getAppUrl } from '@/lib/email/config';
import { sendBusinessCustomerBookingCancelledEmail } from '@/lib/business/email/services/business-emails';
import { notifyBusinessBookingCancelled } from '@/lib/business/email/notify';
import {
  buildBusinessSideRecipients,
  loadBookingCreatorById,
} from '@/lib/business/email/recipients';
import { getBookingTimezone } from '@/lib/business/utils/timezone';

/**
 * POST /api/business/bookings/[id]/cancel
 * Cancel booking. The wallet is not touched.
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
        .select(
          'business_account_id, booking_status, created_by_user_id, created_at, pickup_datetime, wallet_deduction_amount'
        )
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return apiError('Booking not found', 404);
      }

      if (booking.business_account_id !== user.businessAccountId) {
        return apiError('Unauthorized', 403);
      }

      // Staff may only cancel bookings they created themselves.
      if (user.role !== 'owner' && booking.created_by_user_id !== user.businessId) {
        return apiError('Forbidden: you can only cancel bookings you created', 403);
      }

      // Whether a vendor is on this booking, asked of booking_assignments rather
      // than of booking_status. booking_status is never set to 'assigned' anywhere
      // in the product, so a booking with a driver on it still reads 'confirmed':
      // testing the status here would let exactly the case this blocks straight
      // through. A partial unique index keeps this to at most one row.
      const { data: activeAssignment, error: assignmentError } = await supabaseAdmin
        .from('booking_assignments')
        .select('id')
        .eq('business_booking_id', bookingId)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      // Fail closed. An unreadable assignments table must not be the reason a
      // booking a vendor is already driving to gets cancelled.
      if (assignmentError) {
        console.error('Failed to check booking assignments before cancellation:', assignmentError);
        return apiError('Unable to verify this booking right now. Please try again.', 503);
      }

      // The same rule the booking detail page renders, evaluated again here. The
      // page decides what to show; this decides what is allowed.
      const eligibility = getCancellationEligibility(booking, {
        windowMinutes: await loadCancellationWindowMinutes(),
        hasActiveAssignment: activeAssignment !== null,
      });

      if (!eligibility.canCancel) {
        return apiError(eligibility.reason, 403);
      }

      // Call atomic cancellation function
      const { data: result, error } = await supabaseAdmin.rpc(
        'cancel_business_booking_with_refund',
        {
          p_booking_id: bookingId,
          p_cancellation_reason: body.cancellation_reason,
          // Always zero. The RPC still owns the row lock, the settled-status
          // guard, the cancelled_at write and the activity row; it simply skips
          // the add_to_wallet branch. Refunds are a decision, not a side effect.
          p_refund_amount: 0,
          // The function writes its own booking.cancelled activity row inside
          // the same transaction. Passing the actor is what makes that row name
          // a person instead of falling back to the system.
          p_actor_business_user_id: user.businessId,
          p_actor_name: user.memberName ?? user.memberEmail ?? undefined,
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

      // The RPC returns what it actually did, which is nothing: refund_amount is
      // the zero passed in, and new_balance is the balance re-read unchanged. Read
      // back rather than assumed, so the emails below state a fact.
      const refundAmount = result?.[0]?.refund_amount || 0;
      const newBalance = result?.[0]?.new_balance || 0;

      // The RPC owns the booking row, but knows nothing about vendor assignments, so
      // close them here and release the vehicle and driver.
      // Deliberately after the RPC: a cleanup failure must not undo a cancellation.
      const { error: closeError } = await closeActiveAssignments({
        businessBookingId: bookingId,
        outcome: 'cancelled',
        reason: body.cancellation_reason || 'Cancelled by business',
      });

      if (closeError) {
        console.error('Failed to close assignment after business cancellation:', closeError);
      }

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
          timeZone: getBookingTimezone(),
          dateStyle: 'full',
          timeStyle: 'short',
        });

        // The balance is AED. Render it in the business's preferred currency.
        const displayCurrency = businessAccount.preferred_currency || BUSINESS_BASE_CURRENCY;
        const rates = await getExchangeRates();
        const toDisplay = (aed: number) => convertFromAed(aed, displayCurrency, rates);

        // These sends are deliberately not awaited, and are wrapped in after() because a
        // tenant's own SMTP server is a multi round-trip conversation against a host of
        // unknown latency. An un-awaited promise would frequently be dropped when the
        // serverless instance froze after the response; after() keeps the invocation
        // alive past the response without delaying it.
        after(async () => {
          // To the owner, and to the staff member who created the booking - unless that is
          // the person who just cancelled it, who watched it succeed on screen.
          const recipients = buildBusinessSideRecipients({
            ownerEmail: businessAccount.business_email,
            ownerName: businessAccount.business_name,
            creator: await loadBookingCreatorById(booking.created_by_user_id),
            actorMemberId: user.businessId,
          });

          notifyBusinessBookingCancelled(recipients, {
            businessAccountId: user.businessAccountId,
            businessName: businessAccount.business_name,
            bookingNumber: cancelledBooking.booking_number,
            tripNumber: cancelledBooking.trip_number,
            customerName: cancelledBooking.customer_name,
            pickupLocation,
            dropoffLocation,
            pickupDateTime,
            cancellationReason: body.cancellation_reason,
            // Zero, always. The template has an arm for it that says refunds are
            // reviewed by the team, so the owner is not left waiting on money that
            // is not coming by itself.
            refundAmount: 0,
            newBalance: toDisplay(newBalance),
            currency: displayCurrency,
            walletUrl: `${getAppUrl()}/business/wallet`,
          }).catch((err: unknown) => {
            console.error('Failed to send business cancellation email:', err);
          });

          // Send cancellation email to customer
          if (cancelledBooking.customer_email) {
            sendBusinessCustomerBookingCancelledEmail({
              businessAccountId: user.businessAccountId,
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
        });

        // Create in-app notification. The type string is left as it is: it is
        // matched elsewhere to pick an icon, and renaming it buys nothing.
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
            p_message: `Booking for ${cancelledBooking.customer_name} cancelled. No refund is issued automatically; contact support if one is due.`,
            p_data: {
              booking_number: cancelledBooking.booking_number,
              trip_number: cancelledBooking.trip_number,
              refund_amount: 0,
              new_balance: newBalance,
              currency: businessAccount.currency || 'AED',
            },
            p_link: `/business/bookings/${bookingId}`,
          }).then(({ error: notifError }) => {
            if (notifError) console.error('Failed to create cancellation notification:', notifError);
          });
        }
      }

      return apiSuccess({
        message: 'Booking cancelled successfully',
        new_balance: formatCurrency(newBalance),
        refunded: false,
        refund_reason:
          'The amount held for this booking has not been returned to your wallet. Refunds are reviewed by our team.',
      });
    } catch (error) {
      console.error('Cancel booking API error:', error);
      return apiError('Failed to cancel booking', 500);
    }
  }
);
