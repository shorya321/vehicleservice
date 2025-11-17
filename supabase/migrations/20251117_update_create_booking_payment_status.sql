-- Update create_booking_with_wallet_deduction to set payment_status
-- Migration: 20251117_update_create_booking_payment_status
-- Date: 2025-11-17
-- Description: Ensure all new business bookings are created with payment_status = 'completed'

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

  -- Call deduct_from_wallet and handle JSON return value
  v_deduct_result := deduct_from_wallet(
    p_business_id,
    p_total_price,
    v_temp_description, -- description in position 3 (matches current signature)
    NULL::UUID, -- booking_id in position 4 with explicit type cast
    'USD' -- currency in position 5
  );

  -- Extract new balance from JSON result
  v_new_balance := (v_deduct_result->>'new_balance')::DECIMAL;

  -- Create booking with payment_status = 'completed' (wallet already deducted)
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
    booking_status,
    payment_status
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
    'pending',
    'completed' -- Payment is completed since wallet was deducted
  ) RETURNING id INTO v_booking_id;

  -- Update wallet transaction with booking_id reference
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

COMMENT ON FUNCTION create_booking_with_wallet_deduction IS
  'Atomically creates booking and deducts from wallet. Sets payment_status to completed since wallet is deducted immediately.';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Updated create_booking_with_wallet_deduction to set payment_status = completed';
END $$;
