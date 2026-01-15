/**
 * Booking DateTime Modification API
 * Handle pickup datetime modifications for business bookings
 */

import { NextRequest } from 'next/server';
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

/**
 * PATCH /api/business/bookings/[id]/datetime
 * Modify the pickup datetime of a booking
 */
export const PATCH = requireBusinessAuth(
  async (request: NextRequest, user, context: { params: { id: string } }) => {
    const bookingId = context.params.id;

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
          business_account_id,
          booking_status,
          pickup_datetime,
          customer_name,
          customer_email,
          pickup_address,
          dropoff_address
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

      // 3. If booking is assigned, send email to vendor
      if (booking.booking_status === 'assigned') {
        // Fetch assignment and vendor details
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
          .single();

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
              customerName: booking.customer_name,
              pickupAddress: booking.pickup_address,
              previousDatetime: previousDatetime,
              newDatetime: newPickupDatetime,
              modificationReason: reason,
              bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/bookings/${bookingId}`,
            });
          } catch (emailError) {
            console.error('Failed to send vendor notification email:', emailError);
            // Don't fail the request, email is secondary
          }
        }
      }

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
