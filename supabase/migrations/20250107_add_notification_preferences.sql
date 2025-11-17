-- ============================================================================
-- Migration: Add Wallet Notification Preferences
-- Description: Adds notification preferences for business wallet events
-- Author: System
-- Date: 2025-01-07
-- ============================================================================

-- ============================================================================
-- 1. Add Notification Preference Columns to business_accounts
-- ============================================================================

ALTER TABLE business_accounts
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "low_balance_alert": {
    "enabled": true,
    "threshold": 100,
    "channels": ["email"]
  },
  "transaction_completed": {
    "enabled": true,
    "channels": ["email"]
  },
  "auto_recharge_success": {
    "enabled": true,
    "channels": ["email"]
  },
  "auto_recharge_failed": {
    "enabled": true,
    "channels": ["email"]
  },
  "wallet_frozen": {
    "enabled": true,
    "channels": ["email"]
  },
  "spending_limit_reached": {
    "enabled": true,
    "channels": ["email"]
  },
  "monthly_statement": {
    "enabled": true,
    "channels": ["email"],
    "frequency": "monthly"
  }
}'::JSONB;

-- Add last notification sent tracking
ALTER TABLE business_accounts
ADD COLUMN IF NOT EXISTS last_low_balance_alert_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_monthly_statement_at TIMESTAMPTZ;

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_business_accounts_notification_preferences
ON business_accounts USING GIN (notification_preferences);

-- ============================================================================
-- 2. Create Notification History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business Reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- low_balance_alert, transaction_completed, etc.
  channel VARCHAR(20) NOT NULL, -- email, sms, in_app

  -- Recipients
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),

  -- Content
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, bounced
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for notification history
CREATE INDEX IF NOT EXISTS idx_wallet_notification_history_business_account
ON wallet_notification_history(business_account_id);

CREATE INDEX IF NOT EXISTS idx_wallet_notification_history_status
ON wallet_notification_history(status) WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_wallet_notification_history_type
ON wallet_notification_history(notification_type);

CREATE INDEX IF NOT EXISTS idx_wallet_notification_history_retry
ON wallet_notification_history(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- Add updated_at trigger
CREATE TRIGGER update_wallet_notification_history_updated_at
  BEFORE UPDATE ON wallet_notification_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. Create Monthly Statement Generation Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_monthly_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business Reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,

  -- Statement Period
  statement_month INTEGER NOT NULL CHECK (statement_month BETWEEN 1 AND 12),
  statement_year INTEGER NOT NULL CHECK (statement_year >= 2024),

  -- Statement Data
  opening_balance DECIMAL(15, 2) NOT NULL,
  closing_balance DECIMAL(15, 2) NOT NULL,
  total_credits DECIMAL(15, 2) DEFAULT 0,
  total_debits DECIMAL(15, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,

  -- PDF Generation
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Email Status
  email_sent_at TIMESTAMPTZ,
  email_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one statement per business per month
  UNIQUE(business_account_id, statement_year, statement_month)
);

-- Add indexes for monthly statements
CREATE INDEX IF NOT EXISTS idx_wallet_monthly_statements_business
ON wallet_monthly_statements(business_account_id);

CREATE INDEX IF NOT EXISTS idx_wallet_monthly_statements_period
ON wallet_monthly_statements(statement_year, statement_month);

CREATE INDEX IF NOT EXISTS idx_wallet_monthly_statements_pending
ON wallet_monthly_statements(email_status) WHERE email_status = 'pending';

-- Add updated_at trigger
CREATE TRIGGER update_wallet_monthly_statements_updated_at
  BEFORE UPDATE ON wallet_monthly_statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Create Function to Check Low Balance and Send Alert
-- ============================================================================

CREATE OR REPLACE FUNCTION check_low_balance_alert(
  p_business_account_id UUID
)
RETURNS TABLE(
  should_send BOOLEAN,
  current_balance DECIMAL(15, 2),
  threshold DECIMAL(15, 2),
  last_alert_sent_at TIMESTAMPTZ
) AS $$
DECLARE
  v_balance DECIMAL(15, 2);
  v_threshold DECIMAL(15, 2);
  v_last_alert TIMESTAMPTZ;
  v_enabled BOOLEAN;
  v_alert_cooldown_hours INTEGER := 24; -- Don't send alert more than once per day
BEGIN
  -- Get current balance and alert settings
  SELECT
    ba.balance,
    (ba.notification_preferences->'low_balance_alert'->>'threshold')::DECIMAL(15, 2),
    ba.last_low_balance_alert_at,
    (ba.notification_preferences->'low_balance_alert'->>'enabled')::BOOLEAN
  INTO v_balance, v_threshold, v_last_alert, v_enabled
  FROM business_accounts ba
  WHERE ba.id = p_business_account_id;

  -- Check if alert should be sent
  RETURN QUERY SELECT
    v_enabled AND
    v_balance < v_threshold AND
    (v_last_alert IS NULL OR v_last_alert < NOW() - (v_alert_cooldown_hours || ' hours')::INTERVAL) AS should_send,
    v_balance AS current_balance,
    v_threshold AS threshold,
    v_last_alert AS last_alert_sent_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Create Function to Update Last Alert Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_last_low_balance_alert(
  p_business_account_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE business_accounts
  SET
    last_low_balance_alert_at = NOW(),
    updated_at = NOW()
  WHERE id = p_business_account_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Create Function to Record Notification
-- ============================================================================

CREATE OR REPLACE FUNCTION record_wallet_notification(
  p_business_account_id UUID,
  p_notification_type VARCHAR(50),
  p_channel VARCHAR(20),
  p_recipient_email VARCHAR(255) DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO wallet_notification_history (
    business_account_id,
    notification_type,
    channel,
    recipient_email,
    subject,
    body,
    metadata,
    status
  ) VALUES (
    p_business_account_id,
    p_notification_type,
    p_channel,
    p_recipient_email,
    p_subject,
    p_body,
    p_metadata,
    'pending'
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Create Function to Update Notification Status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_status(
  p_notification_id UUID,
  p_status VARCHAR(20),
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE wallet_notification_history
  SET
    status = p_status,
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE delivered_at END,
    error_message = p_error_message,
    retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END,
    next_retry_at = CASE
      WHEN p_status = 'failed' AND retry_count < max_retries
      THEN NOW() + ((retry_count + 1) * INTERVAL '1 hour')
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = p_notification_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Create Function to Generate Monthly Statement Data
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_statement_data(
  p_business_account_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE(
  opening_balance DECIMAL(15, 2),
  closing_balance DECIMAL(15, 2),
  total_credits DECIMAL(15, 2),
  total_debits DECIMAL(15, 2),
  transaction_count BIGINT
) AS $$
DECLARE
  v_opening_balance DECIMAL(15, 2);
  v_closing_balance DECIMAL(15, 2);
  v_total_credits DECIMAL(15, 2);
  v_total_debits DECIMAL(15, 2);
  v_transaction_count BIGINT;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Calculate date range for the month
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month')::TIMESTAMPTZ;

  -- Get opening balance (balance at start of month)
  SELECT
    COALESCE(
      (SELECT balance FROM business_accounts WHERE id = p_business_account_id)
      - COALESCE(SUM(amount), 0),
      0
    )
  INTO v_opening_balance
  FROM business_account_transactions
  WHERE business_account_id = p_business_account_id
    AND created_at >= v_start_date
    AND created_at < v_end_date;

  -- Get closing balance (current balance if this month, or opening + transactions)
  SELECT balance INTO v_closing_balance
  FROM business_accounts
  WHERE id = p_business_account_id;

  -- Calculate total credits and debits
  SELECT
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0),
    COUNT(*)
  INTO v_total_credits, v_total_debits, v_transaction_count
  FROM business_account_transactions
  WHERE business_account_id = p_business_account_id
    AND created_at >= v_start_date
    AND created_at < v_end_date;

  RETURN QUERY SELECT
    v_opening_balance,
    v_closing_balance,
    v_total_credits,
    v_total_debits,
    v_transaction_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE wallet_notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_monthly_statements ENABLE ROW LEVEL SECURITY;

-- Notification History Policies
CREATE POLICY "Admins can view all notification history"
  ON wallet_notification_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert notifications"
  ON wallet_notification_history FOR INSERT
  WITH CHECK (true); -- Controlled by SECURITY DEFINER functions

CREATE POLICY "System can update notifications"
  ON wallet_notification_history FOR UPDATE
  USING (true); -- Controlled by SECURITY DEFINER functions

-- Monthly Statements Policies
CREATE POLICY "Admins can view all monthly statements"
  ON wallet_monthly_statements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert monthly statements"
  ON wallet_monthly_statements FOR INSERT
  WITH CHECK (true); -- Controlled by SECURITY DEFINER functions

CREATE POLICY "System can update monthly statements"
  ON wallet_monthly_statements FOR UPDATE
  USING (true); -- Controlled by SECURITY DEFINER functions

-- ============================================================================
-- 10. Comments
-- ============================================================================

COMMENT ON TABLE wallet_notification_history IS 'Tracks all wallet notification attempts and their delivery status';
COMMENT ON TABLE wallet_monthly_statements IS 'Stores generated monthly wallet statements for businesses';
COMMENT ON COLUMN business_accounts.notification_preferences IS 'JSONB configuration for wallet notification preferences';
COMMENT ON FUNCTION check_low_balance_alert IS 'Checks if a low balance alert should be sent for a business';
COMMENT ON FUNCTION record_wallet_notification IS 'Records a new wallet notification attempt';
COMMENT ON FUNCTION update_notification_status IS 'Updates the status of a wallet notification';
COMMENT ON FUNCTION generate_monthly_statement_data IS 'Generates financial summary data for monthly statements';
