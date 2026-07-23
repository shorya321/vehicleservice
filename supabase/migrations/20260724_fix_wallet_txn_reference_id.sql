-- Fix wallet transaction back-patch in create_booking_with_wallet_deduction
-- Migration: 20260724_fix_wallet_txn_reference_id
-- Date: 2026-07-24
-- Description: The function linked the freshly created wallet_transactions row back to the
--              booking by guessing at it:
--
--                WHERE business_account_id = p_business_id
--                  AND reference_id IS NULL
--                  AND transaction_type = 'booking_deduction'
--                  AND created_at = (SELECT MAX(created_at) FROM wallet_transactions
--                                    WHERE business_account_id = p_business_id
--                                      AND transaction_type = 'booking_deduction')
--
--              deduct_from_wallet already RETURNs the exact row's id as `transaction_id`,
--              and this function already captures its result into v_deduct_result - then
--              ignored it in favour of the MAX(created_at) guess.
--
--              Failure mode: if any concurrent booking_deduction for the SAME business
--              commits between this transaction's INSERT and this UPDATE, MAX(created_at)
--              resolves to the other row (which already has a reference_id), the
--              `reference_id IS NULL` predicate then matches nothing, and this booking's
--              wallet row is left orphaned forever with the placeholder description
--              'Booking creation (pending booking ID)'. Wallet reconciliation and the
--              refund path in cancel_business_booking_with_refund - which looks the
--              transaction up by booking - both silently break for that row.
--
--              At one booking per human action this rarely fires. The upcoming quotation
--              conversion flow creates N bookings in a loop for one business, which makes
--              it likely, so it is fixed ahead of that work.
--
--              Behaviour-preserving: same columns set, same values, only the row-matching
--              predicate changes from a guess to the returned primary key. No application
--              code changes. Body is otherwise byte-identical to the live definition
--              (verified against pg_get_functiondef before writing).

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
  p_price_signature_nonce text DEFAULT NULL::text,
  p_adults integer DEFAULT 1,
  p_children integer DEFAULT 0,
  p_infants integer DEFAULT 0
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
  v_transaction_id UUID;
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
  -- The exact row deduct_from_wallet just inserted. Used below instead of guessing.
  v_transaction_id := (v_deduct_result->>'transaction_id')::UUID;

  INSERT INTO business_bookings (
    business_account_id, created_by_user_id,
    customer_name, customer_email, customer_phone,
    from_location_id, to_location_id,
    pickup_address, dropoff_address, pickup_datetime,
    vehicle_type_id, passenger_count,
    adults, children, infants,
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
    p_adults, p_children, p_infants,
    p_base_price, p_total_price, p_total_price,
    p_customer_notes, p_reference_number,
    'confirmed', 'completed',
    p_price_signature, p_price_signature_timestamp, p_price_signature_nonce
  ) RETURNING id INTO v_booking_id;

  -- Link by primary key rather than MAX(created_at). Concurrency-safe.
  UPDATE wallet_transactions
  SET
    reference_id = v_booking_id,
    description = 'Booking deduction for ' || (
      SELECT booking_number FROM business_bookings WHERE id = v_booking_id
    )
  WHERE id = v_transaction_id;

  RETURN v_booking_id;
END;
$function$;

COMMENT ON FUNCTION public.create_booking_with_wallet_deduction IS
  'Creates a business booking and deducts the wallet atomically. Links the wallet transaction by the id returned from deduct_from_wallet (was: MAX(created_at) guess, which mislinked under concurrency).';
