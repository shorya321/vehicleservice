/**
 * Payment Element Support Migration
 * Adds support for Stripe Payment Element with saved payment methods
 * and multi-currency wallet recharge
 */

-- Add payment-related fields to business_accounts
ALTER TABLE business_accounts
  ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_element_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS save_payment_methods BOOLEAN DEFAULT true;

-- Add currency constraint (ISO 4217 currency codes)
ALTER TABLE business_accounts
  ADD CONSTRAINT check_valid_currency
  CHECK (preferred_currency ~ '^[A-Z]{3}$');

-- Create payment_methods table to store saved payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
  payment_method_type VARCHAR(50) NOT NULL, -- card, bank_account, etc.

  -- Card details (if applicable)
  card_brand VARCHAR(50), -- visa, mastercard, amex, etc.
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_funding VARCHAR(20), -- credit, debit, prepaid

  -- Billing details
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_country VARCHAR(2),

  -- Status and metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT payment_methods_business_fkey FOREIGN KEY (business_account_id)
    REFERENCES business_accounts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_business
  ON payment_methods(business_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id
  ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default
  ON payment_methods(business_account_id, is_default)
  WHERE is_default = true;

-- Add updated_at trigger for payment_methods
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_methods_updated_at ON payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();

-- Create function to ensure only one default payment method per business
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other default payment methods for this business
    UPDATE payment_methods
    SET is_default = false, updated_at = NOW()
    WHERE business_account_id = NEW.business_account_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Row Level Security (RLS) Policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS payment_methods_select ON payment_methods;
  DROP POLICY IF EXISTS payment_methods_insert ON payment_methods;
  DROP POLICY IF EXISTS payment_methods_update ON payment_methods;
  DROP POLICY IF EXISTS payment_methods_delete ON payment_methods;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy: Business users can view their own payment methods
CREATE POLICY payment_methods_select ON payment_methods
  FOR SELECT
  USING (
    business_account_id IN (
      SELECT ba.id::uuid
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

-- Policy: Business users can insert their own payment methods
CREATE POLICY payment_methods_insert ON payment_methods
  FOR INSERT
  WITH CHECK (
    business_account_id IN (
      SELECT ba.id::uuid
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

-- Policy: Business users can update their own payment methods
CREATE POLICY payment_methods_update ON payment_methods
  FOR UPDATE
  USING (
    business_account_id IN (
      SELECT ba.id::uuid
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

-- Policy: Business users can delete their own payment methods
CREATE POLICY payment_methods_delete ON payment_methods
  FOR DELETE
  USING (
    business_account_id IN (
      SELECT ba.id::uuid
      FROM business_accounts ba
      JOIN business_users bu ON bu.business_account_id = ba.id
      WHERE bu.auth_user_id = auth.uid()
    )
  );

-- Add currency field to wallet_transactions for multi-currency support
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 6),
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3);

-- Add constraint for currency format
ALTER TABLE wallet_transactions
  ADD CONSTRAINT check_transaction_currency
  CHECK (currency ~ '^[A-Z]{3}$');

-- Add constraint for original currency format (if present)
ALTER TABLE wallet_transactions
  ADD CONSTRAINT check_transaction_original_currency
  CHECK (original_currency IS NULL OR original_currency ~ '^[A-Z]{3}$');

-- Create function to get active payment methods for a business
CREATE OR REPLACE FUNCTION get_business_payment_methods(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  stripe_payment_method_id VARCHAR(255),
  payment_method_type VARCHAR(50),
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.stripe_payment_method_id,
    pm.payment_method_type,
    pm.card_brand,
    pm.card_last4,
    pm.card_exp_month,
    pm.card_exp_year,
    pm.is_default,
    pm.last_used_at
  FROM payment_methods pm
  WHERE pm.business_account_id = p_business_id
    AND pm.is_active = true
  ORDER BY pm.is_default DESC, pm.last_used_at DESC NULLS LAST, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get default payment method for a business
CREATE OR REPLACE FUNCTION get_default_payment_method(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  stripe_payment_method_id VARCHAR(255),
  payment_method_type VARCHAR(50),
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.stripe_payment_method_id,
    pm.payment_method_type,
    pm.card_brand,
    pm.card_last4
  FROM payment_methods pm
  WHERE pm.business_account_id = p_business_id
    AND pm.is_default = true
    AND pm.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE payment_methods IS 'Stores saved Stripe payment methods for business accounts';
COMMENT ON COLUMN payment_methods.stripe_payment_method_id IS 'Stripe PaymentMethod ID (pm_xxx)';
COMMENT ON COLUMN payment_methods.is_default IS 'Whether this is the default payment method for the business';
COMMENT ON COLUMN payment_methods.is_active IS 'Whether the payment method is still valid and usable';
COMMENT ON COLUMN business_accounts.preferred_currency IS 'Preferred currency for wallet transactions (ISO 4217 code)';
COMMENT ON COLUMN business_accounts.payment_element_enabled IS 'Whether Payment Element is enabled for this business';
COMMENT ON COLUMN business_accounts.save_payment_methods IS 'Whether the business allows saving payment methods for future use';
