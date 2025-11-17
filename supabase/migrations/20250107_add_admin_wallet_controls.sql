-- ============================================================================
-- Admin Wallet Controls Migration
-- ============================================================================
-- This migration adds comprehensive admin controls for business wallets:
-- 1. Admin audit log for tracking manual adjustments
-- 2. Wallet freeze/lock mechanism
-- 3. Spending limits (per transaction, daily, monthly)
-- 4. Admin adjustment functions with audit trail
-- 5. Enhanced deduct_from_wallet() with limit enforcement
-- 6. RLS policies for admin-only access
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Add Wallet Control Fields to business_accounts
-- ============================================================================

ALTER TABLE business_accounts
ADD COLUMN IF NOT EXISTS wallet_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wallet_frozen_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wallet_frozen_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS wallet_frozen_reason TEXT,
ADD COLUMN IF NOT EXISTS max_transaction_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS max_daily_spend DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS max_monthly_spend DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS spending_limits_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN business_accounts.wallet_frozen IS 'Whether the wallet is frozen (no transactions allowed)';
COMMENT ON COLUMN business_accounts.wallet_frozen_at IS 'Timestamp when wallet was frozen';
COMMENT ON COLUMN business_accounts.wallet_frozen_by IS 'Admin user who froze the wallet';
COMMENT ON COLUMN business_accounts.wallet_frozen_reason IS 'Reason for freezing the wallet';
COMMENT ON COLUMN business_accounts.max_transaction_amount IS 'Maximum amount per transaction';
COMMENT ON COLUMN business_accounts.max_daily_spend IS 'Maximum total spend per day';
COMMENT ON COLUMN business_accounts.max_monthly_spend IS 'Maximum total spend per month';
COMMENT ON COLUMN business_accounts.spending_limits_enabled IS 'Whether spending limits are enforced';

-- ============================================================================
-- 2. Create Admin Wallet Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_wallet_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'manual_credit',
    'manual_debit',
    'freeze_wallet',
    'unfreeze_wallet',
    'set_spending_limits',
    'remove_spending_limits',
    'override_limit'
  )),
  amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  reason TEXT NOT NULL,
  previous_balance DECIMAL(12, 2),
  new_balance DECIMAL(12, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT admin_wallet_audit_log_business_account_id_fkey
    FOREIGN KEY (business_account_id) REFERENCES business_accounts(id) ON DELETE CASCADE,
  CONSTRAINT admin_wallet_audit_log_admin_user_id_fkey
    FOREIGN KEY (admin_user_id) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_wallet_audit_log_business
  ON admin_wallet_audit_log(business_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_audit_log_admin
  ON admin_wallet_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_wallet_audit_log_action
  ON admin_wallet_audit_log(action_type, created_at DESC);

COMMENT ON TABLE admin_wallet_audit_log IS 'Audit log for all admin actions on business wallets';

-- ============================================================================
-- 3. Create Admin Manual Adjustment Function
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_adjust_wallet(
  p_business_account_id UUID,
  p_admin_user_id UUID,
  p_amount DECIMAL(12, 2),
  p_reason TEXT,
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
  v_action_type VARCHAR(50);
  v_description TEXT;
BEGIN
  -- Validate admin user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = p_admin_user_id AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User is not authorized to perform this action';
  END IF;

  -- Get current balance
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found';
  END IF;

  -- Check if wallet is frozen (admins can adjust frozen wallets)
  -- This is intentionally allowed for admin recovery scenarios

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Adjustment would result in negative balance';
  END IF;

  -- Determine action type and description
  IF p_amount > 0 THEN
    v_action_type := 'manual_credit';
    v_description := format('Admin credit: %s', p_reason);
  ELSE
    v_action_type := 'manual_debit';
    v_description := format('Admin debit: %s', p_reason);
  END IF;

  -- Update wallet balance
  UPDATE business_accounts
  SET
    wallet_balance = v_new_balance,
    updated_at = NOW()
  WHERE id = p_business_account_id;

  -- Create wallet transaction record
  INSERT INTO wallet_transactions (
    business_account_id,
    transaction_type,
    amount,
    currency,
    description,
    balance_after,
    created_by,
    metadata
  ) VALUES (
    p_business_account_id,
    'admin_adjustment',
    p_amount,
    p_currency,
    v_description,
    v_new_balance,
    p_admin_user_id,
    jsonb_build_object(
      'admin_user_id', p_admin_user_id,
      'reason', p_reason,
      'action_type', v_action_type
    )
  )
  RETURNING id INTO v_transaction_id;

  -- Create audit log entry
  INSERT INTO admin_wallet_audit_log (
    business_account_id,
    admin_user_id,
    action_type,
    amount,
    currency,
    reason,
    previous_balance,
    new_balance,
    metadata
  ) VALUES (
    p_business_account_id,
    p_admin_user_id,
    v_action_type,
    p_amount,
    p_currency,
    p_reason,
    v_current_balance,
    v_new_balance,
    jsonb_build_object(
      'transaction_id', v_transaction_id
    )
  );

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to adjust wallet: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION admin_adjust_wallet IS 'Allows admins to manually adjust business wallet balance with audit trail';

-- ============================================================================
-- 4. Create Freeze/Unfreeze Wallet Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION freeze_business_wallet(
  p_business_account_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(12, 2);
BEGIN
  -- Validate admin user
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = p_admin_user_id AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User is not authorized to perform this action';
  END IF;

  -- Get current balance
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found';
  END IF;

  -- Check if already frozen
  IF EXISTS (
    SELECT 1 FROM business_accounts
    WHERE id = p_business_account_id AND wallet_frozen = TRUE
  ) THEN
    RAISE EXCEPTION 'Wallet is already frozen';
  END IF;

  -- Freeze wallet
  UPDATE business_accounts
  SET
    wallet_frozen = TRUE,
    wallet_frozen_at = NOW(),
    wallet_frozen_by = p_admin_user_id,
    wallet_frozen_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_business_account_id;

  -- Create audit log entry
  INSERT INTO admin_wallet_audit_log (
    business_account_id,
    admin_user_id,
    action_type,
    reason,
    previous_balance,
    new_balance,
    metadata
  ) VALUES (
    p_business_account_id,
    p_admin_user_id,
    'freeze_wallet',
    p_reason,
    v_current_balance,
    v_current_balance,
    jsonb_build_object(
      'frozen_at', NOW()
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Wallet frozen successfully',
    'frozen_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to freeze wallet: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION unfreeze_business_wallet(
  p_business_account_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(12, 2);
BEGIN
  -- Validate admin user
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = p_admin_user_id AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User is not authorized to perform this action';
  END IF;

  -- Get current balance
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found';
  END IF;

  -- Check if frozen
  IF NOT EXISTS (
    SELECT 1 FROM business_accounts
    WHERE id = p_business_account_id AND wallet_frozen = TRUE
  ) THEN
    RAISE EXCEPTION 'Wallet is not frozen';
  END IF;

  -- Unfreeze wallet
  UPDATE business_accounts
  SET
    wallet_frozen = FALSE,
    wallet_frozen_at = NULL,
    wallet_frozen_by = NULL,
    wallet_frozen_reason = NULL,
    updated_at = NOW()
  WHERE id = p_business_account_id;

  -- Create audit log entry
  INSERT INTO admin_wallet_audit_log (
    business_account_id,
    admin_user_id,
    action_type,
    reason,
    previous_balance,
    new_balance,
    metadata
  ) VALUES (
    p_business_account_id,
    p_admin_user_id,
    'unfreeze_wallet',
    p_reason,
    v_current_balance,
    v_current_balance,
    jsonb_build_object(
      'unfrozen_at', NOW()
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Wallet unfrozen successfully',
    'unfrozen_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to unfreeze wallet: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION freeze_business_wallet IS 'Freezes a business wallet to prevent all transactions';
COMMENT ON FUNCTION unfreeze_business_wallet IS 'Unfreezes a business wallet to allow transactions';

-- ============================================================================
-- 5. Create Set Spending Limits Function
-- ============================================================================

CREATE OR REPLACE FUNCTION set_spending_limits(
  p_business_account_id UUID,
  p_admin_user_id UUID,
  p_max_transaction_amount DECIMAL(12, 2) DEFAULT NULL,
  p_max_daily_spend DECIMAL(12, 2) DEFAULT NULL,
  p_max_monthly_spend DECIMAL(12, 2) DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT TRUE,
  p_reason TEXT DEFAULT 'Updated spending limits'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL(12, 2);
BEGIN
  -- Validate admin user
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE auth_user_id = p_admin_user_id AND user_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User is not authorized to perform this action';
  END IF;

  -- Get current balance
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found';
  END IF;

  -- Validate limits are positive
  IF (p_max_transaction_amount IS NOT NULL AND p_max_transaction_amount <= 0) OR
     (p_max_daily_spend IS NOT NULL AND p_max_daily_spend <= 0) OR
     (p_max_monthly_spend IS NOT NULL AND p_max_monthly_spend <= 0) THEN
    RAISE EXCEPTION 'Spending limits must be positive values';
  END IF;

  -- Update spending limits
  UPDATE business_accounts
  SET
    max_transaction_amount = p_max_transaction_amount,
    max_daily_spend = p_max_daily_spend,
    max_monthly_spend = p_max_monthly_spend,
    spending_limits_enabled = p_enabled,
    updated_at = NOW()
  WHERE id = p_business_account_id;

  -- Create audit log entry
  INSERT INTO admin_wallet_audit_log (
    business_account_id,
    admin_user_id,
    action_type,
    reason,
    previous_balance,
    new_balance,
    metadata
  ) VALUES (
    p_business_account_id,
    p_admin_user_id,
    CASE WHEN p_enabled THEN 'set_spending_limits' ELSE 'remove_spending_limits' END,
    p_reason,
    v_current_balance,
    v_current_balance,
    jsonb_build_object(
      'max_transaction_amount', p_max_transaction_amount,
      'max_daily_spend', p_max_daily_spend,
      'max_monthly_spend', p_max_monthly_spend,
      'enabled', p_enabled
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Spending limits updated successfully',
    'limits', jsonb_build_object(
      'max_transaction_amount', p_max_transaction_amount,
      'max_daily_spend', p_max_daily_spend,
      'max_monthly_spend', p_max_monthly_spend,
      'enabled', p_enabled
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to set spending limits: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION set_spending_limits IS 'Sets spending limits for a business account';

-- ============================================================================
-- 6. Enhanced deduct_from_wallet Function with Limit Enforcement
-- ============================================================================

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
    p_booking_id::TEXT,
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

COMMENT ON FUNCTION deduct_from_wallet IS 'Deducts amount from business wallet with freeze and spending limit checks';

-- ============================================================================
-- 7. Get Admin Audit Log Function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_audit_log(
  p_business_account_id UUID DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_action_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  business_account_id UUID,
  business_name TEXT,
  admin_user_id UUID,
  admin_email TEXT,
  action_type VARCHAR(50),
  amount DECIMAL(12, 2),
  currency VARCHAR(3),
  reason TEXT,
  previous_balance DECIMAL(12, 2),
  new_balance DECIMAL(12, 2),
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aal.id,
    aal.business_account_id,
    ba.business_name,
    aal.admin_user_id,
    au.email AS admin_email,
    aal.action_type,
    aal.amount,
    aal.currency,
    aal.reason,
    aal.previous_balance,
    aal.new_balance,
    aal.metadata,
    aal.created_at
  FROM admin_wallet_audit_log aal
  INNER JOIN business_accounts ba ON aal.business_account_id = ba.id
  INNER JOIN auth.users au ON aal.admin_user_id = au.id
  WHERE
    (p_business_account_id IS NULL OR aal.business_account_id = p_business_account_id)
    AND (p_admin_user_id IS NULL OR aal.admin_user_id = p_admin_user_id)
    AND (p_start_date IS NULL OR aal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR aal.created_at <= p_end_date)
    AND (p_action_types IS NULL OR aal.action_type = ANY(p_action_types))
  ORDER BY aal.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_admin_audit_log IS 'Retrieves admin wallet audit log with filtering';

-- ============================================================================
-- 8. RLS Policies for Admin Access
-- ============================================================================

-- Enable RLS on admin_wallet_audit_log
ALTER TABLE admin_wallet_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all audit logs
CREATE POLICY admin_wallet_audit_log_admin_select
  ON admin_wallet_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.user_role = 'admin'
    )
  );

-- Policy: Admins can insert audit logs (via functions only, but adding for completeness)
CREATE POLICY admin_wallet_audit_log_admin_insert
  ON admin_wallet_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.user_role = 'admin'
    )
  );

-- ============================================================================
-- 9. Grant Permissions
-- ============================================================================

GRANT SELECT ON admin_wallet_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION freeze_business_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION unfreeze_business_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION set_spending_limits TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_from_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_audit_log TO authenticated;

COMMIT;
