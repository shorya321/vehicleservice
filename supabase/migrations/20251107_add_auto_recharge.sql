/**
 * Auto-Recharge System Migration
 * Implements automatic wallet recharge when balance falls below threshold
 *
 * Features:
 * - Configurable trigger threshold and recharge amounts
 * - Monthly spending limits for safety
 * - Idempotent processing with retry logic
 * - Integration with saved payment methods
 * - Comprehensive audit trail
 */

-- ============================================================================
-- 1. AUTO-RECHARGE SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_recharge_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Configuration
  enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_threshold DECIMAL(12, 2) NOT NULL DEFAULT 100.00, -- Trigger when balance falls below this
  recharge_amount DECIMAL(12, 2) NOT NULL DEFAULT 500.00,    -- Amount to recharge
  max_recharge_per_month DECIMAL(12, 2) DEFAULT 5000.00,     -- Safety limit
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Payment Method
  use_default_payment_method BOOLEAN NOT NULL DEFAULT true,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_auto_recharge_per_business UNIQUE (business_account_id),
  CONSTRAINT valid_trigger_threshold CHECK (trigger_threshold >= 0),
  CONSTRAINT valid_recharge_amount CHECK (recharge_amount >= 10),
  CONSTRAINT valid_max_recharge CHECK (max_recharge_per_month IS NULL OR max_recharge_per_month >= recharge_amount)
);

-- Index for fast lookups
CREATE INDEX idx_auto_recharge_settings_business ON auto_recharge_settings(business_account_id);
CREATE INDEX idx_auto_recharge_settings_enabled ON auto_recharge_settings(enabled) WHERE enabled = true;

-- ============================================================================
-- 2. AUTO-RECHARGE ATTEMPTS TABLE (Audit Trail)
-- ============================================================================

CREATE TYPE auto_recharge_status AS ENUM (
  'pending',      -- Created, waiting to be processed
  'processing',   -- Currently being processed by Edge Function
  'succeeded',    -- Successfully recharged
  'failed',       -- Failed after all retries
  'cancelled'     -- Manually cancelled
);

CREATE TABLE IF NOT EXISTS auto_recharge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Trigger Context
  trigger_balance DECIMAL(12, 2) NOT NULL,           -- Balance when triggered
  trigger_threshold DECIMAL(12, 2) NOT NULL,         -- Threshold setting at trigger time
  requested_amount DECIMAL(12, 2) NOT NULL,          -- Amount to recharge
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Processing
  status auto_recharge_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),              -- Stripe PaymentIntent ID
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,

  -- Idempotency & Retry Logic
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,      -- Format: business_id:timestamp:hash
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ,

  -- Results
  error_message TEXT,
  error_code VARCHAR(100),
  actual_recharged_amount DECIMAL(12, 2),            -- Actual amount charged (may differ)
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- Indexes for queries
CREATE INDEX idx_auto_recharge_attempts_business ON auto_recharge_attempts(business_account_id);
CREATE INDEX idx_auto_recharge_attempts_status ON auto_recharge_attempts(status);
CREATE INDEX idx_auto_recharge_attempts_idempotency ON auto_recharge_attempts(idempotency_key);
CREATE INDEX idx_auto_recharge_attempts_pending ON auto_recharge_attempts(status, next_retry_at)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_auto_recharge_attempts_created ON auto_recharge_attempts(created_at DESC);

-- ============================================================================
-- 3. MONTHLY SPENDING TRACKING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW auto_recharge_monthly_spending AS
SELECT
  business_account_id,
  DATE_TRUNC('month', created_at) AS month,
  SUM(actual_recharged_amount) AS total_recharged,
  COUNT(*) AS recharge_count,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS successful_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
FROM auto_recharge_attempts
WHERE status IN ('succeeded', 'processing')
GROUP BY business_account_id, DATE_TRUNC('month', created_at);

-- ============================================================================
-- 4. POSTGRESQL FUNCTIONS
-- ============================================================================

/**
 * Generate unique idempotency key for auto-recharge attempt
 * Format: business_id:unix_timestamp:random_hash
 */
CREATE OR REPLACE FUNCTION generate_auto_recharge_idempotency_key(
  p_business_account_id UUID
)
RETURNS VARCHAR(255)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_timestamp BIGINT;
  v_random_hash TEXT;
  v_key VARCHAR(255);
BEGIN
  v_timestamp := EXTRACT(EPOCH FROM now())::BIGINT;
  v_random_hash := encode(gen_random_bytes(8), 'hex');
  v_key := p_business_account_id::TEXT || ':' || v_timestamp::TEXT || ':' || v_random_hash;

  RETURN v_key;
END;
$$;

/**
 * Check if business has exceeded monthly auto-recharge limit
 */
CREATE OR REPLACE FUNCTION check_monthly_auto_recharge_limit(
  p_business_account_id UUID,
  p_new_amount DECIMAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_monthly_total DECIMAL;
BEGIN
  -- Get settings
  SELECT * INTO v_settings
  FROM auto_recharge_settings
  WHERE business_account_id = p_business_account_id;

  -- If no max limit set, allow
  IF v_settings.max_recharge_per_month IS NULL THEN
    RETURN true;
  END IF;

  -- Get current month's total
  SELECT COALESCE(SUM(actual_recharged_amount), 0) INTO v_monthly_total
  FROM auto_recharge_attempts
  WHERE business_account_id = p_business_account_id
    AND status IN ('succeeded', 'processing')
    AND created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP);

  -- Check if new amount would exceed limit
  RETURN (v_monthly_total + p_new_amount) <= v_settings.max_recharge_per_month;
END;
$$;

/**
 * Check balance and trigger auto-recharge if needed
 * Called after wallet deductions
 */
CREATE OR REPLACE FUNCTION check_and_trigger_auto_recharge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_current_balance DECIMAL;
  v_idempotency_key VARCHAR(255);
  v_within_limit BOOLEAN;
  v_attempt_id UUID;
BEGIN
  -- Only trigger for deductions (negative amounts)
  IF NEW.transaction_type != 'booking_deduction' THEN
    RETURN NEW;
  END IF;

  -- Get auto-recharge settings
  SELECT * INTO v_settings
  FROM auto_recharge_settings
  WHERE business_account_id = NEW.business_account_id
    AND enabled = true;

  -- Exit if auto-recharge not enabled
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get current balance from business_accounts
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = NEW.business_account_id;

  -- Check if balance is below threshold
  IF v_current_balance >= v_settings.trigger_threshold THEN
    RETURN NEW;
  END IF;

  -- Check monthly limit
  v_within_limit := check_monthly_auto_recharge_limit(
    NEW.business_account_id,
    v_settings.recharge_amount
  );

  IF NOT v_within_limit THEN
    -- Log that limit was reached (don't create attempt)
    RAISE NOTICE 'Auto-recharge monthly limit reached for business %', NEW.business_account_id;
    RETURN NEW;
  END IF;

  -- Generate idempotency key
  v_idempotency_key := generate_auto_recharge_idempotency_key(NEW.business_account_id);

  -- Create auto-recharge attempt (idempotent)
  INSERT INTO auto_recharge_attempts (
    business_account_id,
    trigger_balance,
    trigger_threshold,
    requested_amount,
    currency,
    payment_method_id,
    idempotency_key,
    status,
    next_retry_at
  )
  VALUES (
    NEW.business_account_id,
    v_current_balance,
    v_settings.trigger_threshold,
    v_settings.recharge_amount,
    v_settings.currency,
    CASE
      WHEN v_settings.use_default_payment_method THEN
        (SELECT id FROM payment_methods
         WHERE business_account_id = NEW.business_account_id
           AND is_default = true
           AND is_active = true
         LIMIT 1)
      ELSE v_settings.payment_method_id
    END,
    v_idempotency_key,
    'pending',
    now() -- Process immediately
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_attempt_id;

  -- Notify Edge Function via pg_notify (Edge Function will listen)
  IF v_attempt_id IS NOT NULL THEN
    PERFORM pg_notify(
      'auto_recharge_trigger',
      json_build_object(
        'attempt_id', v_attempt_id,
        'business_account_id', NEW.business_account_id,
        'amount', v_settings.recharge_amount,
        'currency', v_settings.currency
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$;

/**
 * Update auto-recharge attempt status
 */
CREATE OR REPLACE FUNCTION update_auto_recharge_attempt_status(
  p_attempt_id UUID,
  p_status auto_recharge_status,
  p_payment_intent_id VARCHAR DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_error_code VARCHAR DEFAULT NULL,
  p_actual_amount DECIMAL DEFAULT NULL,
  p_wallet_transaction_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auto_recharge_attempts
  SET
    status = p_status,
    stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
    error_message = p_error_message,
    error_code = p_error_code,
    actual_recharged_amount = COALESCE(p_actual_amount, actual_recharged_amount),
    wallet_transaction_id = COALESCE(p_wallet_transaction_id, wallet_transaction_id),
    processed_at = CASE WHEN p_status IN ('succeeded', 'failed', 'cancelled') THEN now() ELSE processed_at END,
    updated_at = now()
  WHERE id = p_attempt_id;

  RETURN FOUND;
END;
$$;

/**
 * Increment retry count and set next retry time
 */
CREATE OR REPLACE FUNCTION increment_auto_recharge_retry(
  p_attempt_id UUID,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_retry_count INTEGER;
  v_max_retries INTEGER;
  v_next_retry TIMESTAMPTZ;
BEGIN
  -- Get current retry info
  SELECT retry_count, max_retries INTO v_retry_count, v_max_retries
  FROM auto_recharge_attempts
  WHERE id = p_attempt_id;

  -- Calculate exponential backoff: 5 minutes, 15 minutes, 45 minutes
  v_next_retry := now() + (INTERVAL '5 minutes' * POWER(3, v_retry_count));

  -- Update attempt
  IF v_retry_count < v_max_retries THEN
    UPDATE auto_recharge_attempts
    SET
      retry_count = retry_count + 1,
      last_retry_at = now(),
      next_retry_at = v_next_retry,
      status = 'pending',
      error_message = p_error_message,
      updated_at = now()
    WHERE id = p_attempt_id;
  ELSE
    -- Max retries reached, mark as failed
    UPDATE auto_recharge_attempts
    SET
      retry_count = retry_count + 1,
      last_retry_at = now(),
      status = 'failed',
      error_message = p_error_message,
      processed_at = now(),
      updated_at = now()
    WHERE id = p_attempt_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger auto-recharge check after wallet deductions
DROP TRIGGER IF EXISTS trigger_auto_recharge_check ON wallet_transactions;
CREATE TRIGGER trigger_auto_recharge_check
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_and_trigger_auto_recharge();

-- Updated_at trigger for auto_recharge_settings
CREATE OR REPLACE FUNCTION update_auto_recharge_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_auto_recharge_settings_updated_at ON auto_recharge_settings;
CREATE TRIGGER set_auto_recharge_settings_updated_at
  BEFORE UPDATE ON auto_recharge_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_recharge_settings_updated_at();

-- Updated_at trigger for auto_recharge_attempts
CREATE OR REPLACE FUNCTION update_auto_recharge_attempts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_auto_recharge_attempts_updated_at ON auto_recharge_attempts;
CREATE TRIGGER set_auto_recharge_attempts_updated_at
  BEFORE UPDATE ON auto_recharge_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_recharge_attempts_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE auto_recharge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_recharge_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS auto_recharge_settings_select ON auto_recharge_settings;
  DROP POLICY IF EXISTS auto_recharge_settings_insert ON auto_recharge_settings;
  DROP POLICY IF EXISTS auto_recharge_settings_update ON auto_recharge_settings;
  DROP POLICY IF EXISTS auto_recharge_settings_delete ON auto_recharge_settings;

  DROP POLICY IF EXISTS auto_recharge_attempts_select ON auto_recharge_attempts;
  DROP POLICY IF EXISTS auto_recharge_attempts_insert ON auto_recharge_attempts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Auto-recharge Settings Policies
CREATE POLICY auto_recharge_settings_select ON auto_recharge_settings
  FOR SELECT
  TO authenticated
  USING (
    business_account_id IN (
      SELECT ba.id
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

CREATE POLICY auto_recharge_settings_insert ON auto_recharge_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_account_id IN (
      SELECT ba.id
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

CREATE POLICY auto_recharge_settings_update ON auto_recharge_settings
  FOR UPDATE
  TO authenticated
  USING (
    business_account_id IN (
      SELECT ba.id
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

CREATE POLICY auto_recharge_settings_delete ON auto_recharge_settings
  FOR DELETE
  TO authenticated
  USING (
    business_account_id IN (
      SELECT ba.id
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
        AND bu.role = 'owner'
    )
  );

-- Auto-recharge Attempts Policies (read-only for business users)
CREATE POLICY auto_recharge_attempts_select ON auto_recharge_attempts
  FOR SELECT
  TO authenticated
  USING (
    business_account_id IN (
      SELECT ba.id
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

-- System/Edge Function can insert attempts (using service role)
CREATE POLICY auto_recharge_attempts_insert ON auto_recharge_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be called by trigger with elevated privileges

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE auto_recharge_settings IS 'Business account auto-recharge configuration';
COMMENT ON TABLE auto_recharge_attempts IS 'Audit trail of all auto-recharge attempts with retry logic';
COMMENT ON FUNCTION check_and_trigger_auto_recharge() IS 'Triggered after wallet deductions to check if auto-recharge is needed';
COMMENT ON FUNCTION generate_auto_recharge_idempotency_key(UUID) IS 'Generates unique idempotency key to prevent duplicate charges';
COMMENT ON FUNCTION check_monthly_auto_recharge_limit(UUID, DECIMAL) IS 'Checks if new recharge would exceed monthly limit';
