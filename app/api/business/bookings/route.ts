/**
 * Business Bookings API
 * Create and manage business bookings
 */

import { NextRequest } from 'next/server';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { bookingCreationSchema } from '@/lib/business/validators';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/business/bookings
 * Create new booking with atomic wallet deduction
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, bookingCreationSchema);

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
    // Call atomic function to create booking and deduct from wallet
    const { data: bookingId, error } = await supabaseAdmin.rpc(
      'create_booking_with_wallet_deduction',
      {
        p_business_id: user.businessAccountId,
        p_created_by_user_id: user.businessId,
        p_customer_name: body.customer_name,
        p_customer_email: body.customer_email,
        p_customer_phone: body.customer_phone,
        p_from_location_id: body.from_location_id,
        p_to_location_id: body.to_location_id,
        p_pickup_address: body.pickup_address,
        p_dropoff_address: body.dropoff_address,
        p_pickup_datetime: body.pickup_datetime,
        p_vehicle_type_id: body.vehicle_type_id,
        p_passenger_count: body.passenger_count,
        p_luggage_count: body.luggage_count,
        p_base_price: body.base_price,
        p_amenities_price: body.amenities_price,
        p_total_price: body.total_price,
        p_customer_notes: body.customer_notes || null,
        p_reference_number: body.reference_number || null,
      }
    );

    if (error) {
      console.error('Booking creation error:', error);

      // Check for insufficient balance error
      if (error.message.includes('Insufficient wallet balance')) {
        return apiError('Insufficient wallet balance. Please add credits.', 402);
      }

      return apiError(error.message || 'Failed to create booking', 500);
    }

    // Get the created booking details
    const { data: booking } = await supabaseAdmin
      .from('business_bookings')
      .select('id, booking_number')
      .eq('id', bookingId)
      .single();

    return apiSuccess(
      {
        id: bookingId,
        booking_number: booking?.booking_number,
        message: 'Booking created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Booking API error:', error);
    return apiError('Failed to create booking', 500);
  }
});
