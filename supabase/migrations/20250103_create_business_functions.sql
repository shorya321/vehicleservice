-- B2B Business Account Module - Atomic Database Functions
-- Migration: Create atomic wallet operations
-- Date: 2025-01-03
-- Description: Functions that prevent race conditions in wallet operations

-- =============================================
-- FUNCTION 1: deduct_from_wallet
-- Purpose: Atomically deduct from wallet balance
-- Returns: New balance after deduction
-- Raises: Exception if insufficient balance
-- =============================================
CREATE OR REPLACE FUNCTION deduct_from_wallet(
  p_business_id UUID,
  p_amount DECIMAL,
  p_booking_id UUID,
  p_description TEXT
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Lock the business account row for update (prevents concurrent modifications)
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  -- Raise exception if business account not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found: %', p_business_id;
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Required: %',
      v_current_balance, p_amount;
  END IF;

  -- Deduct from wallet atomically
  UPDATE business_accounts
  SET wallet_balance = wallet_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_business_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log transaction in wallet_transactions
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by
  ) VALUES (
    p_business_id,
    -p_amount, -- Negative for deduction
    'booking_deduction',
    p_description,
    p_booking_id,
    v_new_balance,
    'system'
  );

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION deduct_from_wallet IS
  'Atomically deducts amount from business wallet. Uses FOR UPDATE lock to prevent race conditions.';

-- =============================================
-- FUNCTION 2: add_to_wallet
-- Purpose: Atomically add to wallet balance
-- Returns: New balance after addition
-- =============================================
CREATE OR REPLACE FUNCTION add_to_wallet(
  p_business_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT,
  p_created_by TEXT DEFAULT 'system',
  p_reference_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('credit_added', 'refund', 'admin_adjustment') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Lock the business account row for update
  SELECT wallet_balance INTO v_new_balance
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  -- Raise exception if business account not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found: %', p_business_id;
  END IF;

  -- Add to wallet atomically
  UPDATE business_accounts
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_business_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by,
    stripe_payment_intent_id
  ) VALUES (
    p_business_id,
    p_amount, -- Positive for addition
    p_transaction_type,
    p_description,
    p_reference_id,
    v_new_balance,
    p_created_by,
    p_stripe_payment_intent_id
  );

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION add_to_wallet IS
  'Atomically adds amount to business wallet. Used for recharge, refunds, and admin adjustments.';

-- =============================================
-- FUNCTION 3: cancel_business_booking_with_refund
-- Purpose: Atomically cancel booking and refund to wallet
-- Returns: TABLE with refund_amount and new_balance
-- =============================================
CREATE OR REPLACE FUNCTION cancel_business_booking_with_refund(
  p_booking_id UUID,
  p_cancellation_reason TEXT
) RETURNS TABLE (
  refund_amount DECIMAL,
  new_balance DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
  v_refund_amount DECIMAL;
  v_new_balance DECIMAL;
  v_booking_number TEXT;
  v_booking_status TEXT;
BEGIN
  -- Lock booking row and get details
  SELECT
    business_account_id,
    wallet_deduction_amount,
    booking_number,
    booking_status
  INTO
    v_business_id,
    v_refund_amount,
    v_booking_number,
    v_booking_status
  FROM business_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  -- Raise exception if booking not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  -- Check if booking can be cancelled
  IF v_booking_status IN ('cancelled', 'completed', 'refunded') THEN
    RAISE EXCEPTION 'Cannot cancel booking with status: %', v_booking_status;
  END IF;

  -- Update booking status to cancelled
  UPDATE business_bookings
  SET
    booking_status = 'cancelled',
    cancellation_reason = p_cancellation_reason,
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Refund to wallet using add_to_wallet function
  SELECT add_to_wallet(
    v_business_id,
    v_refund_amount,
    'refund',
    'Refund for cancelled booking ' || v_booking_number,
    'system',
    p_booking_id,
    NULL
  ) INTO v_new_balance;

  -- Return refund details
  RETURN QUERY SELECT v_refund_amount, v_new_balance;
END;
$$;

COMMENT ON FUNCTION cancel_business_booking_with_refund IS
  'Atomically cancels booking and refunds amount to business wallet. All operations in single transaction.';

-- =============================================
-- FUNCTION 4: create_booking_with_wallet_deduction
-- Purpose: Atomically create booking and deduct from wallet
-- Returns: booking_id
-- Ensures: Both succeed together or both fail together
-- =============================================
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
  v_new_balance DECIMAL;
  v_temp_description TEXT;
BEGIN
  -- First, deduct from wallet (this locks the wallet row)
  v_temp_description := 'Booking creation (pending booking ID)';

  SELECT deduct_from_wallet(
    p_business_id,
    p_total_price,
    NULL, -- booking_id not yet known
    v_temp_description
  ) INTO v_new_balance;

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
  'Atomically creates booking and deducts from wallet. If either fails, both roll back.';
