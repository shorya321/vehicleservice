-- Migration: Set AED as Default Currency
-- This updates the currency_settings table to set AED as the default display currency
-- and updates existing exchange rates to use AED as the base currency

-- Step 1: Set all currencies to non-default
UPDATE currency_settings SET is_default = false WHERE is_default = true;

-- Step 2: Set AED as the default currency
UPDATE currency_settings SET is_default = true WHERE currency_code = 'AED';

-- Step 3: Delete old USD-based exchange rates (they will be re-fetched with AED base)
DELETE FROM exchange_rates WHERE base_currency = 'USD';

-- Step 4: Insert initial AED-based exchange rates as fallback
-- These rates represent: 1 AED = X target currency
INSERT INTO exchange_rates (base_currency, target_currency, rate, fetched_at)
VALUES
  ('AED', 'AED', 1.0, NOW()),
  ('AED', 'USD', 0.27, NOW()),
  ('AED', 'EUR', 0.25, NOW()),
  ('AED', 'GBP', 0.22, NOW()),
  ('AED', 'AUD', 0.41, NOW()),
  ('AED', 'CAD', 0.37, NOW()),
  ('AED', 'CHF', 0.24, NOW()),
  ('AED', 'SAR', 1.02, NOW()),
  ('AED', 'SGD', 0.37, NOW()),
  ('AED', 'INR', 22.65, NOW()),
  ('AED', 'JPY', 40.74, NOW())
ON CONFLICT (base_currency, target_currency)
DO UPDATE SET rate = EXCLUDED.rate, fetched_at = EXCLUDED.fetched_at;
