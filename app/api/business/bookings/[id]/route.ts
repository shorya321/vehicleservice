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
import { sendBusinessCustomerBookingCancelledEmail } from '@/lib/email/services/business-emails';
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone';

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

      // Deleting NEVER moves money. Refunds belong to cancellation alone, where the published
      // 24-hour policy is applied (see getCancellationRefund + the cancel route).
      //
      // This previously called an RPC named `add_wallet_balance` that has never existed in the
      // database — the real function is `add_to_wallet`. The error was logged, deletion
      // continued regardless, and the response still reported `refunded: true`, so the money
      // silently vanished. The guard was also wrong: it omitted 'completed', so once the call
      // was corrected it would have refunded already-delivered trips.
      //
      // Removing the refund entirely fixes both, and makes the ordering question moot: with no
      // money moving there is nothing to keep atomic with the delete.

      // Send customer cancellation email BEFORE deletion (data won't exist after)
      if (booking.customer_email) {
        const { data: businessAccount } = await supabaseAdmin
          .from('business_accounts')
          .select('business_name, currency')
          .eq('id', user.businessAccountId)
          .single();

        const pickupLocation = (booking as any).from_location?.name
          ? `${(booking as any).from_location.name}${booking.pickup_address ? ` - ${booking.pickup_address}` : ''}`
          : booking.pickup_address || 'N/A';

        const dropoffLocation = (booking as any).to_location?.name
          ? `${(booking as any).to_location.name}${booking.dropoff_address ? ` - ${booking.dropoff_address}` : ''}`
          : booking.dropoff_address || 'N/A';

        const pickupDateTime = new Date(booking.pickup_datetime).toLocaleString('en-US', {
          timeZone: BOOKING_TIMEZONE,
          dateStyle: 'full',
          timeStyle: 'short',
        });

        sendBusinessCustomerBookingCancelledEmail({
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
            p_message: `Booking for ${booking.customer_name} deleted. No refund is issued on deletion — cancel a booking to release its refund.`,
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
      }

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
        // Deletion never refunds — see the note above. Reported explicitly so no caller infers
        // otherwise, as the previous response wrongly did.
        refunded: false,
      });
    } catch (error) {
      console.error('Delete booking API error:', error);
      return apiError('Failed to delete booking', 500);
    }
  }
);
