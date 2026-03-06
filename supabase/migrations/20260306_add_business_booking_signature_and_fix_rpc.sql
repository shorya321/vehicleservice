-- Migration: 20260306_add_business_booking_signature_and_fix_rpc
-- Description: Add HMAC signature columns to business_bookings for nonce replay protection,
--              and fix RPC to remove nonexistent columns (luggage_count, amenities_price)
--              while adding signature storage parameters.

-- 1. Add HMAC signature columns to business_bookings
ALTER TABLE business_bookings
  ADD COLUMN IF NOT EXISTS price_signature TEXT,
  ADD COLUMN IF NOT EXISTS price_signature_timestamp BIGINT,
  ADD COLUMN IF NOT EXISTS price_signature_nonce TEXT;

-- 2. Unique index on nonce to prevent replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_bookings_price_signature_nonce
  ON business_bookings (price_signature_nonce)
  WHERE price_signature_nonce IS NOT NULL;

-- 3. Drop old function signature (different param count, no signature params)
DROP FUNCTION IF EXISTS create_booking_with_wallet_deduction(
  UUID, UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TIMESTAMPTZ,
  UUID, INTEGER, DECIMAL, DECIMAL, TEXT, TEXT
);

-- 4. Create updated RPC with signature params for nonce storage
CREATE OR REPLACE FUNCTION create_booking_with_wallet_deduction(
  p_business_id UUID,
  p_created_by_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_from_location_id UUID,
  p_to_location_id UUID,
  p_pickup_address TEXT,
  p_dropoff_address TEXT,
  p_pickup_datetime TIMESTAMPTZ,
  p_vehicle_type_id UUID,
  p_passenger_count INTEGER,
  p_base_price DECIMAL,
  p_total_price DECIMAL,
  p_customer_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_price_signature TEXT DEFAULT NULL,
  p_price_signature_timestamp BIGINT DEFAULT NULL,
  p_price_signature_nonce TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    'USD'
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
    'pending', 'completed',
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
$$;

COMMENT ON FUNCTION create_booking_with_wallet_deduction(
  UUID, UUID, TEXT, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TIMESTAMPTZ,
  UUID, INTEGER, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, BIGINT, TEXT
) IS 'Atomically creates booking and deducts from wallet. Stores HMAC signature nonce for replay protection. Sets payment_status to completed since wallet is deducted immediately.';
