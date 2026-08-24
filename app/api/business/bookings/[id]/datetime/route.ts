/**
 * Booking DateTime Modification API
 * Handle pickup datetime modifications for business bookings
 */

import { NextRequest, after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { bookingDatetimeModificationSchema } from '@/lib/business/validators';
import {
  canModifyBookingDateTime,
  validateNewPickupDatetime,
  getModificationEligibility,
  MODIFIABLE_STATUSES,
} from '@/lib/business/booking-utils';
import { sendBookingDatetimeModifiedEmail } from '@/lib/email/services/vendor-emails';
import { sendBusinessCustomerDatetimeChangedEmail } from '@/lib/business/email/services/business-emails';
import { notifyBusinessBookingRescheduled } from '@/lib/business/email/notify';
import { getAppUrl } from '@/lib/email/config';
import {
  buildBusinessSideRecipients,
  loadBookingCreatorById,
} from '@/lib/business/email/recipients';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';

/**
 * Mail goes out inside after(), which runs on the platform's clock, not the response's.
 * A tenant's own SMTP server is a multi round-trip conversation bounded by
 * SEND_DEADLINE_MS (25s, lib/email/transport/deliver.ts), so the invocation needs room
 * past that or it is cut off mid-send with nothing written to the delivery log.
 *
 * 60 is the Vercel Hobby ceiling. Raising it needs a plan that allows it.
 */
export const maxDuration = 60;

/**
 * PATCH /api/business/bookings/[id]/datetime
 * Modify the pickup datetime of a booking
 */
export const PATCH = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const bookingId = id;

    // Use admin client for database operations
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
      // Parse and validate request body
      const body = await request.json();
      const validationResult = bookingDatetimeModificationSchema.safeParse(body);

      if (!validationResult.success) {
        return apiError(validationResult.error.errors[0].message, 400);
      }

      const { pickup_datetime: newPickupDatetime, reason } = validationResult.data;

      // Validate new datetime is valid
      const datetimeValidation = validateNewPickupDatetime(newPickupDatetime);
      if (!datetimeValidation.isValid) {
        return apiError(datetimeValidation.error!, 400);
      }

      // Fetch booking with assignment info
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('business_bookings')
        .select(
          `
          id,
          booking_number,
          trip_number,
          business_account_id,
          booking_status,
          pickup_datetime,
          customer_name,
          customer_email,
          pickup_address,
          dropoff_address,
          created_by_user_id
        `
        )
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return apiError('Booking not found', 404);
      }

      // Verify ownership
      if (booking.business_account_id !== user.businessAccountId) {
        return apiError('Unauthorized', 403);
      }

      // Staff may only reschedule bookings they created themselves.
      if (user.role !== 'owner' && booking.created_by_user_id !== user.businessId) {
        return apiError('Forbidden: you can only modify bookings you created', 403);
      }

      // Check if booking can be modified
      const eligibility = getModificationEligibility({
        booking_status: booking.booking_status,
        pickup_datetime: booking.pickup_datetime,
      });

      if (!eligibility.canModify) {
        return apiError(eligibility.reason, 400);
      }

      // Check if new datetime is the same as current
      if (new Date(newPickupDatetime).getTime() === new Date(booking.pickup_datetime).getTime()) {
        return apiError('New pickup time is the same as current time', 400);
      }

      // Start transaction-like operations
      const previousDatetime = booking.pickup_datetime;

      // 1. Update the booking
      const { error: updateError } = await supabaseAdmin
        .from('business_bookings')
        .update({
          pickup_datetime: newPickupDatetime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to update booking datetime:', updateError);
        return apiError('Failed to update booking', 500);
      }

      // 2. Create audit record
      const { error: auditError } = await supabaseAdmin
        .from('booking_datetime_modifications')
        .insert({
          booking_id: bookingId,
          previous_datetime: previousDatetime,
          new_datetime: newPickupDatetime,
          modified_by_user_id: user.userId,
          modification_reason: reason || null,
        });

      if (auditError) {
        console.error('Failed to create audit record:', auditError);
        // Don't fail the request, audit is secondary
      }

      // 3. Tell the vendor, if there is one on this booking.
      //
      // This was gated on `booking.booking_status === 'assigned'`, a value that
      // is never written: vendor assignment lives entirely in
      // booking_assignments.status, so a booking a vendor has accepted still
      // reads 'confirmed'. The whole block was therefore unreachable, and a
      // vendor was never told that the pickup time had moved - the one change
      // they most need to hear about. The query below already asks the right
      // question, so the status gate is simply removed rather than replaced.
      //
      // maybeSingle, not single: most bookings have no active assignment, and
      // that is an ordinary outcome rather than an error to log.
      const { data: assignment } = await supabaseAdmin
        .from('booking_assignments')
        .select(
          `
          id,
          vendor_id,
          vendor_applications!inner(
            id,
            business_name,
            business_email,
            user_id
          )
        `
        )
        .eq('business_booking_id', bookingId)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (assignment?.vendor_applications) {
        const vendor = assignment.vendor_applications as {
          id: string;
          business_name: string;
          business_email: string;
          user_id: string;
        };

        // Send email notification to vendor
        try {
          await sendBookingDatetimeModifiedEmail({
            vendorEmail: vendor.business_email,
            vendorName: vendor.business_name,
            bookingNumber: booking.booking_number,
            tripNumber: booking.trip_number,
            customerName: booking.customer_name,
            pickupAddress: booking.pickup_address,
            previousDatetime: previousDatetime,
            newDatetime: newPickupDatetime,
            modificationReason: reason,
            bookingUrl: `${getAppUrl()}/vendor/bookings/${bookingId}`,
          });
        } catch (emailError) {
          console.error('Failed to send vendor notification email:', emailError);
          // Don't fail the request, email is secondary
        }
      }

      // The one email where the time is the entire message, so it must not
      // render in whatever zone the server happens to run in.
      const formatDt = (dt: string) =>
        formatBookingDateTime(dt, "EEEE, d MMMM yyyy 'at' HH:mm");

      // business_email is needed now that the business side is told too. Read outside the
      // customer_email guard below: a booking without a passenger address is legal, and
      // used to mean nobody heard about the change at all.
      const { data: businessAccount } = await supabaseAdmin
        .from('business_accounts')
        .select('business_name, business_email')
        .eq('id', booking.business_account_id)
        .single();

      // The caller does not wait on mail: this runs inside after(), once the response has
      // been flushed. The sends are awaited in there because after() keeps the invocation
      // alive only while the promise its callback returns is pending, and a callback that
      // merely starts them returns on the first tick. On a serverless host that lets the
      // instance freeze on top of the send and its delivery-log row.
      after(async () => {
        const sends: Promise<unknown>[] = [];

        // Rescheduling used to tell the vendor and the passenger and say nothing to the
        // business, so the account that owns the trip could be the last to know it moved.
        // The creator is skipped when they are the one who moved it.
        const recipients = buildBusinessSideRecipients({
          ownerEmail: businessAccount?.business_email ?? null,
          ownerName: businessAccount?.business_name ?? null,
          creator: await loadBookingCreatorById(booking.created_by_user_id),
          actorMemberId: user.businessId,
        });

        sends.push(notifyBusinessBookingRescheduled(recipients, {
          businessAccountId: user.businessAccountId,
          businessName: businessAccount?.business_name || 'Your booking provider',
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
          tripNumber: booking.trip_number,
          customerName: booking.customer_name,
          pickupLocation: booking.pickup_address || 'TBD',
          previousDateTime: formatDt(previousDatetime),
          newDateTime: formatDt(newPickupDatetime),
          modificationReason: reason,
        }).catch((err: unknown) => {
          console.error('Failed to send business datetime change email:', err);
        }));

        if (booking.customer_email) {
          sends.push(sendBusinessCustomerDatetimeChangedEmail({
            businessAccountId: user.businessAccountId,
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            businessName: businessAccount?.business_name || 'Your booking provider',
            bookingNumber: booking.booking_number,
            tripNumber: booking.trip_number,
            pickupLocation: booking.pickup_address || 'TBD',
            previousDateTime: formatDt(previousDatetime),
            newDateTime: formatDt(newPickupDatetime),
            modificationReason: reason,
          }).catch((err: unknown) => {
            console.error('Failed to send customer datetime change email:', err);
          }));
        }

        await Promise.allSettled(sends);
      });

      // Fetch updated booking to return
      const { data: updatedBooking } = await supabaseAdmin
        .from('business_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      return apiSuccess({
        message: 'Booking datetime updated successfully',
        booking: updatedBooking,
        modification: {
          previous_datetime: previousDatetime,
          new_datetime: newPickupDatetime,
          reason: reason || null,
        },
      });
    } catch (error) {
      console.error('Update booking datetime API error:', error);
      return apiError('Failed to update booking datetime', 500);
    }
  }
);
