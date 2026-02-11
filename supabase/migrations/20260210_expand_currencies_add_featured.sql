-- Expand currencies to ~50 and add is_featured flag
-- This migration:
-- 1. Adds is_featured column with index
-- 2. Adds trigger to auto-unfeature when disabling a currency
-- 3. Seeds ~39 new currencies (disabled by default)
-- 4. Sets initial featured currencies: AED, USD, EUR, GBP, SAR, INR

-- Step 1: Add is_featured column
ALTER TABLE currency_settings
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_currency_settings_featured
ON currency_settings (is_featured) WHERE is_featured = true;

-- Step 2: Trigger to auto-unfeature when disabling
CREATE OR REPLACE FUNCTION unfeature_disabled_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_enabled = false AND OLD.is_enabled = true THEN
    NEW.is_featured := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_unfeature_disabled_currency ON currency_settings;
CREATE TRIGGER trg_unfeature_disabled_currency
  BEFORE UPDATE ON currency_settings
  FOR EACH ROW
  EXECUTE FUNCTION unfeature_disabled_currency();

-- Step 3: Seed new currencies (all disabled, not featured by default)
INSERT INTO currency_settings (currency_code, name, symbol, decimal_places, is_enabled, is_default, is_featured, display_order)
VALUES
  ('CNY', 'Chinese Yuan', '¥', 2, false, false, false, 12),
  ('HKD', 'Hong Kong Dollar', 'HK$', 2, false, false, false, 13),
  ('NZD', 'New Zealand Dollar', 'NZ$', 2, false, false, false, 14),
  ('SEK', 'Swedish Krona', 'kr', 2, false, false, false, 15),
  ('NOK', 'Norwegian Krone', 'kr', 2, false, false, false, 16),
  ('DKK', 'Danish Krone', 'kr', 2, false, false, false, 17),
  ('ZAR', 'South African Rand', 'R', 2, false, false, false, 18),
  ('KRW', 'South Korean Won', '₩', 0, false, false, false, 19),
  ('MYR', 'Malaysian Ringgit', 'RM', 2, false, false, false, 20),
  ('THB', 'Thai Baht', '฿', 2, false, false, false, 21),
  ('IDR', 'Indonesian Rupiah', 'Rp', 0, false, false, false, 22),
  ('PHP', 'Philippine Peso', '₱', 2, false, false, false, 23),
  ('TWD', 'Taiwan Dollar', 'NT$', 2, false, false, false, 24),
  ('PLN', 'Polish Zloty', 'zł', 2, false, false, false, 25),
  ('TRY', 'Turkish Lira', '₺', 2, false, false, false, 26),
  ('RUB', 'Russian Ruble', '₽', 2, false, false, false, 27),
  ('BRL', 'Brazilian Real', 'R$', 2, false, false, false, 28),
  ('MXN', 'Mexican Peso', 'MX$', 2, false, false, false, 29),
  ('CLP', 'Chilean Peso', 'CLP$', 0, false, false, false, 30),
  ('COP', 'Colombian Peso', 'COL$', 0, false, false, false, 31),
  ('ARS', 'Argentine Peso', 'AR$', 2, false, false, false, 32),
  ('PEN', 'Peruvian Sol', 'S/.', 2, false, false, false, 33),
  ('CZK', 'Czech Koruna', 'Kč', 2, false, false, false, 34),
  ('HUF', 'Hungarian Forint', 'Ft', 0, false, false, false, 35),
  ('RON', 'Romanian Leu', 'lei', 2, false, false, false, 36),
  ('BGN', 'Bulgarian Lev', 'лв', 2, false, false, false, 37),
  ('HRK', 'Croatian Kuna', 'kn', 2, false, false, false, 38),
  ('ISK', 'Icelandic Krona', 'kr', 0, false, false, false, 39),
  ('ILS', 'Israeli Shekel', '₪', 2, false, false, false, 40),
  ('EGP', 'Egyptian Pound', 'E£', 2, false, false, false, 41),
  ('KWD', 'Kuwaiti Dinar', 'د.ك', 3, false, false, false, 42),
  ('BHD', 'Bahraini Dinar', '.د.ب', 3, false, false, false, 43),
  ('OMR', 'Omani Rial', '﷼', 3, false, false, false, 44),
  ('QAR', 'Qatari Riyal', '﷼', 2, false, false, false, 45),
  ('JOD', 'Jordanian Dinar', 'د.ا', 3, false, false, false, 46),
  ('PKR', 'Pakistani Rupee', '₨', 2, false, false, false, 47),
  ('BDT', 'Bangladeshi Taka', '৳', 2, false, false, false, 48),
  ('LKR', 'Sri Lankan Rupee', 'Rs', 2, false, false, false, 49),
  ('VND', 'Vietnamese Dong', '₫', 0, false, false, false, 50)
ON CONFLICT (currency_code) DO NOTHING;

-- Step 4: Set initial featured currencies (these should already be enabled)
UPDATE currency_settings
SET is_featured = true
WHERE currency_code IN ('AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR');

-- Enable SAR and INR if not already enabled (they are in the original seed)
UPDATE currency_settings
SET is_enabled = true
WHERE currency_code IN ('SAR', 'INR')
AND is_enabled = false;
