-- ============================================================================
-- Fix reference_id Type Mismatch in deduct_from_wallet Function
-- ============================================================================
-- Migration: 20251114_fix_deduct_wallet_reference_id_type
-- Purpose: Remove incorrect TEXT cast on p_booking_id when inserting into reference_id
--
-- ROOT CAUSE: deduct_from_wallet casts p_booking_id::TEXT but reference_id column
--             is UUID type, causing: "column reference_id is of type uuid but
--             expression is of type text"
--
-- FIX: Remove ::TEXT cast since both parameter and column are UUID
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION deduct_from_wallet(
  p_business_account_id UUID,
  p_amount DECIMAL(12, 2),
  p_description TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_currency VARCHAR(3) DEFAULT 'USD'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    metadata
  ) VALUES (
    p_business_account_id,
    'booking_deduction',
    -p_amount,
    p_currency,
    p_description,
    v_new_balance,
    p_booking_id,  -- ✅ FIXED: Removed ::TEXT cast (UUID → UUID directly)
    jsonb_build_object(
      'booking_id', p_booking_id,
      'deducted_at', NOW()
    )
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
$$;

COMMENT ON FUNCTION deduct_from_wallet IS 'Deducts amount from business wallet with freeze and spending limit checks. Fixed reference_id type to UUID.';

COMMIT;
