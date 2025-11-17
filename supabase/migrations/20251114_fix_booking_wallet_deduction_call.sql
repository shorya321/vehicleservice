-- ============================================================================
-- Fix Booking Wallet Deduction Function Call
-- ============================================================================
-- Migration: 20251114_fix_booking_wallet_deduction_call
-- Purpose: Update create_booking_with_wallet_deduction to call deduct_from_wallet
--          with correct argument order matching the deployed function signature
--
-- ROOT CAUSE: deduct_from_wallet was updated to new signature returning JSON,
--             but create_booking_with_wallet_deduction still called it with
--             old argument order causing: "function deduct_from_wallet(uuid,
--             numeric, unknown, text) does not exist"
--
-- FIX: Update the function call to match deployed signature:
--      (business_account_id, amount, description, booking_id, currency) → JSON
-- ============================================================================

BEGIN;

-- Drop and recreate create_booking_with_wallet_deduction with corrected call
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
  p_luggage_count INTEGER,
  p_base_price DECIMAL,
  p_amenities_price DECIMAL,
  p_total_price DECIMAL,
  p_customer_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
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
  -- First, deduct from wallet (this locks the wallet row)
  v_temp_description := 'Booking creation (pending booking ID)';

  -- Call deduct_from_wallet with CORRECT argument order
  -- Signature: (business_account_id, amount, description, booking_id, currency)
  v_deduct_result := deduct_from_wallet(
    p_business_id,           -- arg 1: business_account_id UUID
    p_total_price,           -- arg 2: amount DECIMAL
    v_temp_description,      -- arg 3: description TEXT
    NULL::UUID,              -- arg 4: booking_id UUID (explicit cast)
    'USD'                    -- arg 5: currency VARCHAR
  );

  -- Extract new balance from JSON result
  v_new_balance := (v_deduct_result->>'new_balance')::DECIMAL;

  -- Create booking
  INSERT INTO business_bookings (
    business_account_id,
    created_by_user_id,
    customer_name,
    customer_email,
    customer_phone,
    from_location_id,
    to_location_id,
    pickup_address,
    dropoff_address,
    pickup_datetime,
    vehicle_type_id,
    passenger_count,
    luggage_count,
    base_price,
    amenities_price,
    total_price,
    wallet_deduction_amount,
    customer_notes,
    reference_number,
    booking_status
  ) VALUES (
    p_business_id,
    p_created_by_user_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_from_location_id,
    p_to_location_id,
    p_pickup_address,
    p_dropoff_address,
    p_pickup_datetime,
    p_vehicle_type_id,
    p_passenger_count,
    p_luggage_count,
    p_base_price,
    p_amenities_price,
    p_total_price,
    p_total_price,
    p_customer_notes,
    p_reference_number,
    'pending'
  ) RETURNING id INTO v_booking_id;

  -- Update wallet transaction with booking_id reference
  UPDATE wallet_transactions
  SET
    reference_id = v_booking_id::TEXT,
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

COMMENT ON FUNCTION create_booking_with_wallet_deduction IS
  'Atomically creates booking and deducts from wallet. Updated to match deduct_from_wallet JSON signature.';

COMMIT;
