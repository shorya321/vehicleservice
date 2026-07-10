-- Business module: make AED the default stored currency
--
-- SCOPE: business module only. Deliberately excluded:
--   - admin_adjust_wallet / admin_wallet_audit_log  (admin module)
--   - bookings.currency, zone_pricing.currency      (shared with checkout/search/zones)
--   - get_default_currency(), currency_settings     (public display-currency selector)
--
-- Business wallet balances and booking prices are denominated in AED. The columns and
-- functions below defaulted to 'USD', which mislabelled AED amounts in emails, PDFs,
-- notifications and the transactions list.
--
-- This migration changes DEFAULTS and FUNCTION LITERALS only. It does not modify existing
-- rows; the backfill is a separate, explicitly-confirmed migration.

-- ---------------------------------------------------------------------------
-- 1. Column defaults
-- ---------------------------------------------------------------------------

ALTER TABLE business_accounts   ALTER COLUMN currency           SET DEFAULT 'AED';
ALTER TABLE business_accounts   ALTER COLUMN preferred_currency SET DEFAULT 'AED';
ALTER TABLE wallet_transactions ALTER COLUMN currency           SET DEFAULT 'AED';

-- ---------------------------------------------------------------------------
-- 2. deduct_from_wallet: p_currency DEFAULT 'USD' -> 'AED'
--    Body reproduced verbatim from pg_get_functiondef; only the default changed.
--    Called only by create_booking_with_wallet_deduction (verified).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  p_business_account_id uuid,
  p_amount numeric,
  p_description text,
  p_booking_id uuid DEFAULT NULL::uuid,
  p_currency character varying DEFAULT 'AED'::character varying
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance DECIMAL(12, 2);
  v_new_balance DECIMAL(12, 2);
  v_transaction_id UUID;
  v_wallet_frozen BOOLEAN;
  v_spending_limits_enabled BOOLEAN;
  v_max_transaction_amount DECIMAL(12, 2);
  v_max_daily_spend DECIMAL(12, 2);
  v_max_monthly_spend DECIMAL(12, 2);
  v_daily_spend DECIMAL(12, 2);
  v_monthly_spend DECIMAL(12, 2);
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Deduction amount must be positive';
  END IF;

  -- Get wallet details and limits
  SELECT
    wallet_balance,
    wallet_frozen,
    spending_limits_enabled,
    max_transaction_amount,
    max_daily_spend,
    max_monthly_spend
  INTO
    v_current_balance,
    v_wallet_frozen,
    v_spending_limits_enabled,
    v_max_transaction_amount,
    v_max_daily_spend,
    v_max_monthly_spend
  FROM business_accounts
  WHERE id = p_business_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found';
  END IF;

  -- Check if wallet is frozen
  IF v_wallet_frozen THEN
    RAISE EXCEPTION 'Wallet is frozen. Please contact support.';
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current balance: %, Required: %',
      v_current_balance, p_amount;
  END IF;

  -- Enforce spending limits if enabled
  IF v_spending_limits_enabled THEN
    -- Check per-transaction limit
    IF v_max_transaction_amount IS NOT NULL AND p_amount > v_max_transaction_amount THEN
      RAISE EXCEPTION 'Transaction amount (%) exceeds maximum allowed (%)',
        p_amount, v_max_transaction_amount;
    END IF;

    -- Check daily spending limit
    IF v_max_daily_spend IS NOT NULL THEN
      SELECT COALESCE(SUM(ABS(amount)), 0)
      INTO v_daily_spend
      FROM wallet_transactions
      WHERE business_account_id = p_business_account_id
        AND amount < 0
        AND created_at >= CURRENT_DATE
        AND created_at < CURRENT_DATE + INTERVAL '1 day';

      IF (v_daily_spend + p_amount) > v_max_daily_spend THEN
        RAISE EXCEPTION 'Daily spending limit exceeded. Daily spend: %, Limit: %, Attempted: %',
          v_daily_spend, v_max_daily_spend, p_amount;
      END IF;
    END IF;

    -- Check monthly spending limit
    IF v_max_monthly_spend IS NOT NULL THEN
      SELECT COALESCE(SUM(ABS(amount)), 0)
      INTO v_monthly_spend
      FROM wallet_transactions
      WHERE business_account_id = p_business_account_id
        AND amount < 0
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

      IF (v_monthly_spend + p_amount) > v_max_monthly_spend THEN
        RAISE EXCEPTION 'Monthly spending limit exceeded. Monthly spend: %, Limit: %, Attempted: %',
          v_monthly_spend, v_max_monthly_spend, p_amount;
      END IF;
    END IF;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update wallet balance
  UPDATE business_accounts
  SET
    wallet_balance = v_new_balance,
    updated_at = NOW()
  WHERE id = p_business_account_id;

  -- Create wallet transaction
  INSERT INTO wallet_transactions (
    business_account_id,
    transaction_type,
    amount,
    currency,
    description,
    balance_after,
    reference_id,
    metadata,
    created_by
  ) VALUES (
    p_business_account_id,
    'booking_deduction',
    -p_amount,
    p_currency,
    p_description,
    v_new_balance,
    p_booking_id,
    jsonb_build_object(
      'booking_id', p_booking_id,
      'deducted_at', NOW()
    ),
    'system'
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to deduct from wallet: %', SQLERRM;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3. create_booking_with_wallet_deduction: passes 'USD' -> 'AED'
--    Body reproduced verbatim; only the currency argument changed.
-- ---------------------------------------------------------------------------

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
$function$;
