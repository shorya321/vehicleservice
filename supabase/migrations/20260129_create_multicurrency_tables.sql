-- Multi-Currency Support Tables
-- Creates currency_settings and exchange_rates tables for display-only multi-currency

-- ============================================
-- Currency Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS currency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  is_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_currency_settings_enabled ON currency_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_currency_settings_code ON currency_settings(currency_code);

-- ============================================
-- Exchange Rates Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency VARCHAR(3) DEFAULT 'USD',
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched ON exchange_rates(fetched_at);

-- ============================================
-- Row Level Security Policies
-- ============================================
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Public read access for enabled currencies
CREATE POLICY "Public can read enabled currencies" ON currency_settings
  FOR SELECT USING (is_enabled = true);

-- Public read access for all exchange rates
CREATE POLICY "Public can read exchange rates" ON exchange_rates
  FOR SELECT USING (true);

-- Admin full access to currency_settings
CREATE POLICY "Admin full access to currency_settings" ON currency_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin full access to exchange_rates
CREATE POLICY "Admin full access to exchange_rates" ON exchange_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role access (for edge functions)
CREATE POLICY "Service role full access to currency_settings" ON currency_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to exchange_rates" ON exchange_rates
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Trigger to ensure only one default currency
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_default_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE currency_settings SET is_default = false WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS single_default_currency ON currency_settings;
CREATE TRIGGER single_default_currency
  BEFORE INSERT OR UPDATE ON currency_settings
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_currency();

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_currency_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_currency_settings_timestamp ON currency_settings;
CREATE TRIGGER update_currency_settings_timestamp
  BEFORE UPDATE ON currency_settings
  FOR EACH ROW EXECUTE FUNCTION update_currency_settings_timestamp();

-- ============================================
-- Seed Initial Data (11 currencies)
-- ============================================
INSERT INTO currency_settings (currency_code, name, symbol, decimal_places, is_enabled, is_default, display_order) VALUES
  ('USD', 'US Dollar', '$', 2, true, true, 1),
  ('EUR', 'Euro', '€', 2, true, false, 2),
  ('GBP', 'British Pound', '£', 2, true, false, 3),
  ('AED', 'UAE Dirham', 'د.إ', 2, true, false, 4),
  ('AUD', 'Australian Dollar', 'A$', 2, false, false, 5),
  ('CAD', 'Canadian Dollar', 'C$', 2, false, false, 6),
  ('CHF', 'Swiss Franc', 'CHF', 2, false, false, 7),
  ('SAR', 'Saudi Riyal', '﷼', 2, false, false, 8),
  ('SGD', 'Singapore Dollar', 'S$', 2, false, false, 9),
  ('INR', 'Indian Rupee', '₹', 2, false, false, 10),
  ('JPY', 'Japanese Yen', '¥', 0, false, false, 11)
ON CONFLICT (currency_code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  decimal_places = EXCLUDED.decimal_places;

-- Seed initial exchange rates (fallback values from USD base)
INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'USD', 1.0),
  ('USD', 'EUR', 0.92),
  ('USD', 'GBP', 0.79),
  ('USD', 'AED', 3.67),
  ('USD', 'AUD', 1.52),
  ('USD', 'CAD', 1.36),
  ('USD', 'CHF', 0.88),
  ('USD', 'SAR', 3.75),
  ('USD', 'SGD', 1.34),
  ('USD', 'INR', 83.12),
  ('USD', 'JPY', 149.5)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  fetched_at = now();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get all enabled currencies
CREATE OR REPLACE FUNCTION get_enabled_currencies()
RETURNS TABLE (
  currency_code VARCHAR(3),
  name VARCHAR(50),
  symbol VARCHAR(10),
  decimal_places INTEGER,
  is_default BOOLEAN,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.currency_code,
    cs.name,
    cs.symbol,
    cs.decimal_places,
    cs.is_default,
    cs.display_order
  FROM currency_settings cs
  WHERE cs.is_enabled = true
  ORDER BY cs.display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get exchange rate for a currency pair
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency VARCHAR(3) DEFAULT 'USD',
  p_to_currency VARCHAR(3) DEFAULT 'USD'
)
RETURNS DECIMAL(18,8) AS $$
DECLARE
  v_rate DECIMAL(18,8);
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;

  -- Get direct rate from base currency
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE base_currency = p_from_currency AND target_currency = p_to_currency;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try inverse rate
  SELECT 1.0 / rate INTO v_rate
  FROM exchange_rates
  WHERE base_currency = p_to_currency AND target_currency = p_from_currency;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try through USD as intermediate
  DECLARE
    v_from_usd DECIMAL(18,8);
    v_usd_to DECIMAL(18,8);
  BEGIN
    SELECT rate INTO v_from_usd FROM exchange_rates
    WHERE base_currency = 'USD' AND target_currency = p_from_currency;

    SELECT rate INTO v_usd_to FROM exchange_rates
    WHERE base_currency = 'USD' AND target_currency = p_to_currency;

    IF v_from_usd IS NOT NULL AND v_usd_to IS NOT NULL THEN
      RETURN v_usd_to / v_from_usd;
    END IF;
  END;

  -- Fallback: no conversion
  RETURN 1.0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to convert currency amount
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount DECIMAL,
  p_from_currency VARCHAR(3) DEFAULT 'USD',
  p_to_currency VARCHAR(3) DEFAULT 'USD'
)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL(18,8);
  v_decimals INTEGER;
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;

  v_rate := get_exchange_rate(p_from_currency, p_to_currency);

  -- Get decimal places for target currency
  SELECT decimal_places INTO v_decimals
  FROM currency_settings
  WHERE currency_code = p_to_currency;

  IF v_decimals IS NULL THEN
    v_decimals := 2;
  END IF;

  RETURN ROUND(p_amount * v_rate, v_decimals);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get default currency
CREATE OR REPLACE FUNCTION get_default_currency()
RETURNS VARCHAR(3) AS $$
DECLARE
  v_currency VARCHAR(3);
BEGIN
  SELECT currency_code INTO v_currency
  FROM currency_settings
  WHERE is_default = true
  LIMIT 1;

  RETURN COALESCE(v_currency, 'USD');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_enabled_currencies() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_exchange_rate(VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION convert_currency(DECIMAL, VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_default_currency() TO anon, authenticated;
