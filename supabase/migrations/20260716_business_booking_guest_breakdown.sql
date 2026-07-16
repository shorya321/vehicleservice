-- Business Booking: guest breakdown (adults / children / infants)
-- Date: 2026-07-16
-- Description: The business new-booking Route step captured a single "Guest" number
--              (passenger_count), whose only functional job is filtering vehicle types by
--              passenger_capacity. A single number over-counts seats: infants ride on a lap
--              and do not occupy one, so "4 adults + 2 infants" needed a 6-seater when 4 seats
--              suffice, hiding valid vehicles.
--
--              Semantics (locked):
--                seated total   = adults + children  -> drives capacity, stored in passenger_count
--                head count     = adults + children + infants (display only)
--              passenger_count is NOT removed or re-purposed; it keeps meaning "seats needed",
--              so every existing consumer and the capacity filter work unchanged.
--
--              Scope: business module only. The customer `bookings` table is untouched.
--
--              Backfill: existing rows get adults = passenger_count, children = 0, infants = 0,
--              which reconciles with the legacy meaning of passenger_count. Historical rows are
--              not otherwise re-interpreted.

-- 1. Columns -----------------------------------------------------------------

ALTER TABLE business_bookings
  ADD COLUMN IF NOT EXISTS adults   INTEGER NOT NULL DEFAULT 1 CHECK (adults >= 1),
  ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
  ADD COLUMN IF NOT EXISTS infants  INTEGER NOT NULL DEFAULT 0 CHECK (infants >= 0);

UPDATE business_bookings
   SET adults   = GREATEST(passenger_count, 1),
       children = 0,
       infants  = 0;

-- 2. RPC ---------------------------------------------------------------------
-- Adding parameters changes the function's arity, which creates a SECOND overload rather
-- than replacing the existing one. PostgREST then fails the .rpc() call with
-- "could not choose a best candidate function". Drop the old 19-arg signature first.
--
-- The three new params are appended at the END with defaults: PostgreSQL requires that any
-- parameter following one with a default also have a default, so they cannot sit next to
-- p_passenger_count (p_base_price / p_total_price after it are non-default). The API calls
-- this function with named arguments, so position is irrelevant.
--
-- Body copied verbatim from 20260710_business_booking_confirm_on_wallet_payment.sql (the
-- definition that wins at runtime). Only diffs: 3 new params + 3 INSERT columns/values.
-- booking_status = 'confirmed' is preserved — regressing it to 'pending' would leave
-- wallet-paid business bookings stuck forever.

DROP FUNCTION IF EXISTS public.create_booking_with_wallet_deduction(
  uuid, uuid, text, text, text, uuid, uuid, text, text,
  timestamp with time zone, uuid, integer, numeric, numeric,
  text, text, text, bigint, text
);

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
