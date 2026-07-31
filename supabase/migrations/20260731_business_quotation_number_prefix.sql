-- ============================================================================
-- Business-configurable quotation number prefix
-- ============================================================================
-- Quotation numbers were hardcoded to 'QUO' in generate_quotation_number
-- (20260724_business_quotations.sql), so every white-labelled business shipped
-- quotations branded with the platform's prefix. Businesses now own the prefix.
--
-- Format is unchanged apart from the leading token:
--   <prefix><MMYY><NNNN>   e.g. ACME07260001
--
-- The counter table (business_quotation_number_counters) is deliberately NOT
-- touched: it is keyed on (business_account_id, month_year) only, so changing a
-- prefix mid-month continues the sequence rather than restarting it. Restarting
-- would let a business re-issue a number it already used if it switched a prefix
-- back within the same month, which bq_number_unique_per_business would reject.

-- ----------------------------------------------------------------------------
-- PART 1: prefix column on business_accounts
-- ----------------------------------------------------------------------------
-- NOT NULL DEFAULT 'QUO' backfills every existing row with today's behaviour.

ALTER TABLE business_accounts
  ADD COLUMN IF NOT EXISTS quotation_number_prefix text NOT NULL DEFAULT 'QUO';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ba_quotation_prefix_format'
  ) THEN
    ALTER TABLE business_accounts
      ADD CONSTRAINT ba_quotation_prefix_format
      CHECK (quotation_number_prefix ~ '^[A-Z0-9]{2,6}$');
  END IF;
END $$;

COMMENT ON COLUMN business_accounts.quotation_number_prefix IS
  'Leading token of this business''s quotation numbers (2-6 uppercase alphanumerics). Applies to newly issued quotations only.';

-- ----------------------------------------------------------------------------
-- PART 2: generator reads the prefix
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER is retained: the function must read business_accounts and
-- write the counter table past RLS on behalf of the inserting session.

CREATE OR REPLACE FUNCTION generate_quotation_number(p_business_account_id uuid)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_year TEXT;
  v_next_seq INTEGER;
  v_prefix TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'MMYY');

  SELECT quotation_number_prefix INTO v_prefix
  FROM business_accounts
  WHERE id = p_business_account_id;

  -- Fall back to the platform prefix if the account row is gone or blank.
  v_prefix := COALESCE(NULLIF(v_prefix, ''), 'QUO');

  INSERT INTO business_quotation_number_counters (business_account_id, month_year, last_seq)
  VALUES (p_business_account_id, v_month_year, 1)
  ON CONFLICT (business_account_id, month_year)
  DO UPDATE SET last_seq = business_quotation_number_counters.last_seq + 1
  RETURNING last_seq INTO v_next_seq;

  RETURN v_prefix || v_month_year || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;

-- ----------------------------------------------------------------------------
-- PART 3: pin search_path on the trigger function
-- ----------------------------------------------------------------------------
-- Behaviour is identical; it was the only function in this area without a
-- pinned search_path (cf. 20251103_fix_notification_functions_search_path.sql).

CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := generate_quotation_number(NEW.business_account_id);
  END IF;
  RETURN NEW;
END;
$$;
