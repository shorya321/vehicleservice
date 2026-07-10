-- Business Booking: confirm on wallet payment
-- Date: 2026-07-10
-- Description: Business bookings were created with booking_status = 'pending' even though
--              the wallet deduction completes atomically in this same function (payment_status
--              is already 'completed'). Unlike the customer flow, there is no later payment
--              finalization step to advance the status, so business bookings stayed 'pending'
--              forever in the business and admin booking lists.
--
--              Customer parity: lib/payment/finalize-booking.ts sets both
--              payment_status = 'completed' and booking_status = 'confirmed' once Stripe
--              payment succeeds. Wallet payment clears the instant this function inserts the
--              row, so the booking is confirmed at creation.
--
--              Only change vs the previous definition (20260710_business_aed_default_currency.sql):
--              the booking_status VALUES literal 'pending' -> 'confirmed'.
--              'confirmed' is already allowed by business_bookings_booking_status_check.
--
--              Not backfilled: existing rows stuck at 'pending' are left as-is by decision.
--
--              Vendor assignment/acceptance is unaffected: that lifecycle lives in
--              booking_assignments.status, not booking_status.

CREATE OR REPLACE FUNCTION public.create_booking_with_wallet_deduction(
  p_business_id uuid,
  p_created_by_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_pickup_address text,
  p_dropoff_address text,
  p_pickup_datetime timestamp with time zone,
  p_vehicle_type_id uuid,
  p_passenger_count integer,
  p_base_price numeric,
  p_total_price numeric,
  p_customer_notes text DEFAULT NULL::text,
  p_reference_number text DEFAULT NULL::text,
  p_price_signature text DEFAULT NULL::text,
  p_price_signature_timestamp bigint DEFAULT NULL::bigint,
  p_price_signature_nonce text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_booking_id UUID;
  v_deduct_result JSON;
  v_new_balance DECIMAL;
  v_temp_description TEXT;
BEGIN
  v_temp_description := 'Booking creation (pending booking ID)';

  v_deduct_result := deduct_from_wallet(
    p_business_id,
    p_total_price,
    v_temp_description,
    NULL::UUID,
    'AED'
  );

  v_new_balance := (v_deduct_result->>'new_balance')::DECIMAL;

  INSERT INTO business_bookings (
    business_account_id, created_by_user_id,
    customer_name, customer_email, customer_phone,
    from_location_id, to_location_id,
    pickup_address, dropoff_address, pickup_datetime,
    vehicle_type_id, passenger_count,
    base_price, total_price, wallet_deduction_amount,
    customer_notes, reference_number,
    booking_status, payment_status,
    price_signature, price_signature_timestamp, price_signature_nonce
  ) VALUES (
    p_business_id, p_created_by_user_id,
    p_customer_name, p_customer_email, p_customer_phone,
    p_from_location_id, p_to_location_id,
    p_pickup_address, p_dropoff_address, p_pickup_datetime,
    p_vehicle_type_id, p_passenger_count,
    p_base_price, p_total_price, p_total_price,
    p_customer_notes, p_reference_number,
    'confirmed', 'completed',
    p_price_signature, p_price_signature_timestamp, p_price_signature_nonce
  ) RETURNING id INTO v_booking_id;

  UPDATE wallet_transactions
  SET
    reference_id = v_booking_id,
    description = 'Booking deduction for ' || (
      SELECT booking_number FROM business_bookings WHERE id = v_booking_id
    )
  WHERE business_account_id = p_business_id
    AND reference_id IS NULL
    AND transaction_type = 'booking_deduction'
    AND created_at = (
      SELECT MAX(created_at)
      FROM wallet_transactions
      WHERE business_account_id = p_business_id
        AND transaction_type = 'booking_deduction'
    );

  RETURN v_booking_id;
END;
$function$;
