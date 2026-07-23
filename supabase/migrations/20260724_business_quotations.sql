-- Business Quotations
-- Migration: 20260724_business_quotations
-- Date: 2026-07-24
-- Description: Adds the quotation feature to the business module. A quotation is a
--              customer-facing priced proposal covering one or more DRAFT trips. It creates
--              no bookings and moves no money until it is explicitly converted.
--
--              Money model: every *_aed column is AED, matching the platform invariant that
--              all prices are stored in AED and converted only for display. `currency` +
--              `exchange_rate` capture the business's display currency and the AED->currency
--              rate LOCKED at creation, so a PDF in a customer's hands never changes value.
--
--              Net vs sell: net_* columns are the platform cost (what the wallet will be
--              charged on conversion). sell_total_aed is what the customer is quoted. Only
--              the sell price is ever rendered into the PDF.
--
--              Idempotent by convention (IF NOT EXISTS / DROP POLICY IF EXISTS) because
--              several migrations in this repo were applied out of band.

-- ============================================================================
-- PART 1: business_quotations - the header
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL,

  business_account_id uuid NOT NULL
    REFERENCES business_accounts(id) ON DELETE CASCADE,
  -- Nullable + SET NULL mirrors business_bookings after
  -- 20260721_business_bookings_creator_nullable.sql. Consequence, and it is deliberate:
  -- a quotation whose creator was removed becomes visible to owners only.
  created_by_user_id uuid
    REFERENCES business_users(id) ON DELETE SET NULL,

  -- Customer is free text. An offline quote often starts with only a name, so only
  -- customer_name is required here; email/phone become mandatory at CONVERSION time
  -- because bookingCreationSchema requires them.
  customer_name text NOT NULL,
  customer_company text,
  customer_email text,
  customer_phone text,

  title text,
  notes text,
  terms text,

  -- 'expired' is deliberately NOT a stored status: nothing would transition it without a
  -- cron. It is derived at read time from valid_until.
  status text NOT NULL DEFAULT 'draft',
  valid_until date,

  currency text NOT NULL DEFAULT 'AED',
  exchange_rate numeric(18,8) NOT NULL DEFAULT 1,

  default_markup_pct numeric(6,3) NOT NULL DEFAULT 0,

  subtotal_net_aed  numeric(12,2) NOT NULL DEFAULT 0,
  subtotal_sell_aed numeric(12,2) NOT NULL DEFAULT 0,
  discount_aed      numeric(12,2) NOT NULL DEFAULT 0,
  total_sell_aed    numeric(12,2) NOT NULL DEFAULT 0,

  accepted_at           timestamptz,
  rejected_at           timestamptz,
  converting_started_at timestamptz,
  converted_at          timestamptz,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bq_number_unique_per_business UNIQUE (business_account_id, quotation_number),
  CONSTRAINT bq_currency_format CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT bq_rate_positive   CHECK (exchange_rate > 0),
  CONSTRAINT bq_markup_sane     CHECK (default_markup_pct >= -100 AND default_markup_pct <= 1000),
  CONSTRAINT bq_amounts_nonneg  CHECK (
        subtotal_net_aed  >= 0
    AND subtotal_sell_aed >= 0
    AND discount_aed      >= 0
    AND total_sell_aed    >= 0
  ),
  CONSTRAINT bq_discount_bounded CHECK (discount_aed <= subtotal_sell_aed),
  CONSTRAINT bq_total_consistent CHECK (
    total_sell_aed = ROUND(subtotal_sell_aed - discount_aed, 2)
  ),
  CONSTRAINT bq_status_valid CHECK (status IN (
    'draft','sent','accepted','rejected','converting','partially_converted','converted'
  )),
  CONSTRAINT bq_status_timestamps CHECK (
        (status <> 'accepted'   OR accepted_at           IS NOT NULL)
    AND (status <> 'rejected'   OR rejected_at           IS NOT NULL)
    AND (status <> 'converting' OR converting_started_at IS NOT NULL)
    AND (status <> 'converted'  OR converted_at          IS NOT NULL)
  )
);

-- Lets business_quotation_items carry its own business_account_id and have the DATABASE
-- guarantee it matches the parent, via the composite FK below.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bq_id_account
  ON business_quotations (id, business_account_id);

CREATE INDEX IF NOT EXISTS idx_bq_account_created
  ON business_quotations (business_account_id, created_at DESC);

-- Staff scope: owner sees all, staff filter on created_by_user_id.
-- Mirrors idx_business_bookings_account_creator.
CREATE INDEX IF NOT EXISTS idx_bq_account_creator
  ON business_quotations (business_account_id, created_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bq_open_status
  ON business_quotations (business_account_id, status)
  WHERE status IN ('draft','sent','accepted','converting');

-- Sweeper for locks abandoned by a crashed conversion.
CREATE INDEX IF NOT EXISTS idx_bq_converting
  ON business_quotations (converting_started_at)
  WHERE status = 'converting';

-- ============================================================================
-- PART 2: business_quotation_items - one draft trip
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL,
  -- Defense in depth: the conversion route uses the service-role client, which bypasses
  -- RLS entirely, so the item carries its own tenant key and the composite FK below makes
  -- a cross-tenant item physically impossible.
  business_account_id uuid NOT NULL,

  sort_order integer NOT NULL DEFAULT 0,

  from_location_id uuid NOT NULL REFERENCES locations(id),
  to_location_id   uuid NOT NULL REFERENCES locations(id),
  pickup_address   text NOT NULL,
  dropoff_address  text NOT NULL,
  -- Nullable: a quote may be undated. An item can never CONVERT without one (see
  -- bqi_converted_needs_datetime) and the UI flags undated items up front.
  pickup_datetime  timestamptz,

  vehicle_type_id uuid NOT NULL REFERENCES vehicle_types(id),
  passenger_count integer NOT NULL DEFAULT 1,
  adults          integer NOT NULL DEFAULT 1,
  children        integer NOT NULL DEFAULT 0,
  infants         integer NOT NULL DEFAULT 0,

  description text,

  -- Net = platform cost, from calculateBusinessBookingPrice. Never shown to the customer.
  net_base_price_aed   numeric(12,2) NOT NULL DEFAULT 0,
  net_addons_price_aed numeric(12,2) NOT NULL DEFAULT 0,
  net_total_aed        numeric(12,2) NOT NULL DEFAULT 0,
  -- An ESTIMATE, not an authority: price signatures expire in 30 minutes, so conversion
  -- always re-prices and diffs against this.
  net_quoted_at timestamptz,

  -- Sell = what the customer is quoted. The only money that reaches the PDF.
  sell_total_aed numeric(12,2) NOT NULL DEFAULT 0,
  price_mode     text NOT NULL DEFAULT 'inherited',
  markup_percent numeric(6,3),

  -- Idempotency key for conversion. Written to business_bookings.price_signature_nonce,
  -- which carries a partial UNIQUE index, so a duplicate conversion attempt is refused by
  -- the database instead of double-charging the wallet.
  conversion_nonce text NOT NULL DEFAULT ('qi_' || gen_random_uuid()::text),
  -- RESTRICT, never SET NULL: business bookings can be hard-deleted, and SET NULL would
  -- silently un-convert the item and let a retry charge the wallet a second time.
  converted_booking_id uuid REFERENCES business_bookings(id) ON DELETE RESTRICT,
  converted_booking_number text,
  converted_at timestamptz,
  conversion_error text,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  CONSTRAINT bqi_quotation_fk FOREIGN KEY (quotation_id, business_account_id)
    REFERENCES business_quotations (id, business_account_id) ON DELETE CASCADE,

  -- Mirrors the .refine() in lib/business/validators.ts: every guest occupies a seat,
  -- infants included. A violation here would 400 at conversion, so make it unsaveable.
  CONSTRAINT bqi_pax_consistent CHECK (passenger_count = adults + children + infants),
  CONSTRAINT bqi_pax_bounds CHECK (
        adults >= 1 AND children >= 0 AND infants >= 0
    AND passenger_count BETWEEN 1 AND 20
  ),
  CONSTRAINT bqi_route_distinct CHECK (from_location_id <> to_location_id),
  CONSTRAINT bqi_amounts CHECK (
        net_base_price_aed   >= 0
    AND net_addons_price_aed >= 0
    AND sell_total_aed       >= 0
    AND net_total_aed = ROUND(net_base_price_aed + net_addons_price_aed, 2)
  ),
  -- 'markup' pins a per-line percentage; 'inherited' follows the quotation default;
  -- 'manual' means the sell price was typed directly.
  CONSTRAINT bqi_price_mode CHECK (
        (price_mode = 'markup'                  AND markup_percent IS NOT NULL)
     OR (price_mode IN ('inherited','manual')   AND markup_percent IS NULL)
  ),
  CONSTRAINT bqi_converted_needs_datetime CHECK (
    converted_booking_id IS NULL OR pickup_datetime IS NOT NULL
  ),
  CONSTRAINT bqi_conversion_stamp CHECK (
        (converted_booking_id IS NULL     AND converted_at IS NULL)
     OR (converted_booking_id IS NOT NULL AND converted_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bqi_quotation ON business_quotation_items (quotation_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bqi_sort
  ON business_quotation_items (quotation_id, sort_order);

-- The conversion idempotency key must be globally unique: it becomes a booking nonce.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bqi_conversion_nonce
  ON business_quotation_items (conversion_nonce);

-- One booking may back at most one quotation line.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bqi_booking_unique
  ON business_quotation_items (converted_booking_id)
  WHERE converted_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bqi_pending
  ON business_quotation_items (quotation_id)
  WHERE converted_booking_id IS NULL;

-- ============================================================================
-- PART 3: business_quotation_item_addons
-- ============================================================================
-- A real child table rather than a JSONB snapshot. addons are hard-deleted by admin
-- cleanups guarded only by NOT EXISTS against business_booking_addons / booking_amenities
-- (see 20260716_dubai_addon_cleanup.sql) - a JSONB blob would be invisible to those guards
-- and an outstanding quotation would silently break. RESTRICT makes quotations count.

CREATE TABLE IF NOT EXISTS business_quotation_item_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id  uuid NOT NULL REFERENCES business_quotation_items(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  quantity    integer       NOT NULL CHECK (quantity > 0),
  unit_price  numeric(12,2) NOT NULL CHECK (unit_price  >= 0),
  total_price numeric(12,2) NOT NULL CHECK (total_price >= 0),
  created_at  timestamptz   NOT NULL DEFAULT NOW(),
  CONSTRAINT bqia_total  CHECK (total_price = ROUND(unit_price * quantity, 2)),
  CONSTRAINT bqia_unique UNIQUE (item_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_bqia_item ON business_quotation_item_addons (item_id);

-- ============================================================================
-- PART 4: quotation numbering - per-business atomic counter
-- ============================================================================
-- Modelled on generate_trip_number (20260611_create_trip_number_system.sql), NOT on
-- generate_business_booking_number, which embeds a date into a globally monotonic
-- sequence and leaves visible gaps. Counter is per business so each one sees its own
-- clean sequence; uniqueness is scoped by bq_number_unique_per_business.

CREATE TABLE IF NOT EXISTS business_quotation_number_counters (
  business_account_id uuid NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  month_year text NOT NULL,             -- MMYY
  last_seq integer NOT NULL DEFAULT 0,
  PRIMARY KEY (business_account_id, month_year)
);

ALTER TABLE business_quotation_number_counters ENABLE ROW LEVEL SECURITY;
-- No policies: reachable only through the SECURITY DEFINER function below.

CREATE OR REPLACE FUNCTION generate_quotation_number(p_business_account_id uuid)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_month_year TEXT;
  v_next_seq INTEGER;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'MMYY');

  INSERT INTO business_quotation_number_counters (business_account_id, month_year, last_seq)
  VALUES (p_business_account_id, v_month_year, 1)
  ON CONFLICT (business_account_id, month_year)
  DO UPDATE SET last_seq = business_quotation_number_counters.last_seq + 1
  RETURNING last_seq INTO v_next_seq;

  RETURN 'QUO' || v_month_year || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := generate_quotation_number(NEW.business_account_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_quotation_number ON business_quotations;
CREATE TRIGGER trigger_set_quotation_number
  BEFORE INSERT ON business_quotations
  FOR EACH ROW EXECUTE FUNCTION set_quotation_number();

-- ============================================================================
-- PART 5: item cap
-- ============================================================================
-- Conversion runs one pricing pass + RPC + addon insert + read-back per item inside a
-- single request. Uncapped, a large itinerary exceeds the serverless limit mid-loop and
-- strands the quotation partially converted. A row count cannot be expressed as a CHECK.

CREATE OR REPLACE FUNCTION enforce_quotation_item_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM business_quotation_items
  WHERE quotation_id = NEW.quotation_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'A quotation may contain at most 20 trips';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_quotation_item_cap ON business_quotation_items;
CREATE TRIGGER trigger_quotation_item_cap
  BEFORE INSERT ON business_quotation_items
  FOR EACH ROW EXECUTE FUNCTION enforce_quotation_item_cap();

-- ============================================================================
-- PART 6: updated_at triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_business_quotations_updated_at ON business_quotations;
CREATE TRIGGER update_business_quotations_updated_at
  BEFORE UPDATE ON business_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_quotation_items_updated_at ON business_quotation_items;
CREATE TRIGGER update_business_quotation_items_updated_at
  BEFORE UPDATE ON business_quotation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 7: RLS - owner sees all, staff see only what they created
-- ============================================================================
-- Mirrors 20260721_business_role_rls.sql exactly. Note that every server write path uses
-- the service-role client, which bypasses RLS - these policies protect direct PostgREST
-- access with a member's own anon session key, which is precisely the hole
-- 20260721 was written to close for business_bookings.

ALTER TABLE business_quotations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quotation_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_quotation_item_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business members read permitted quotations"   ON business_quotations;
DROP POLICY IF EXISTS "Business members create quotations"           ON business_quotations;
DROP POLICY IF EXISTS "Business members update permitted quotations" ON business_quotations;
DROP POLICY IF EXISTS "Business members delete permitted quotations" ON business_quotations;

CREATE POLICY "Business members read permitted quotations"
  ON business_quotations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_quotations.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_quotations.created_by_user_id = bu.id)
    )
  );

CREATE POLICY "Business members create quotations"
  ON business_quotations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_quotations.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_quotations.created_by_user_id = bu.id)
    )
  );

CREATE POLICY "Business members update permitted quotations"
  ON business_quotations FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_quotations.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_quotations.created_by_user_id = bu.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_quotations.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_quotations.created_by_user_id = bu.id)
    )
  );

CREATE POLICY "Business members delete permitted quotations"
  ON business_quotations FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_quotations.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_quotations.created_by_user_id = bu.id)
    )
  );

-- Items inherit the parent's rule.
DROP POLICY IF EXISTS "Business members manage permitted quotation items" ON business_quotation_items;
CREATE POLICY "Business members manage permitted quotation items"
  ON business_quotation_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM business_quotations q
      JOIN business_users bu
        ON bu.business_account_id = q.business_account_id
      WHERE q.id = business_quotation_items.quotation_id
        AND bu.auth_user_id = auth.uid()
        AND bu.is_active
        AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_quotations q
      JOIN business_users bu
        ON bu.business_account_id = q.business_account_id
      WHERE q.id = business_quotation_items.quotation_id
        AND bu.auth_user_id = auth.uid()
        AND bu.is_active
        AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)
    )
  );

DROP POLICY IF EXISTS "Business members manage permitted quotation item addons" ON business_quotation_item_addons;
CREATE POLICY "Business members manage permitted quotation item addons"
  ON business_quotation_item_addons FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM business_quotation_items i
      JOIN business_quotations q ON q.id = i.quotation_id
      JOIN business_users bu ON bu.business_account_id = q.business_account_id
      WHERE i.id = business_quotation_item_addons.item_id
        AND bu.auth_user_id = auth.uid()
        AND bu.is_active
        AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM business_quotation_items i
      JOIN business_quotations q ON q.id = i.quotation_id
      JOIN business_users bu ON bu.business_account_id = q.business_account_id
      WHERE i.id = business_quotation_item_addons.item_id
        AND bu.auth_user_id = auth.uid()
        AND bu.is_active
        AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)
    )
  );

-- ============================================================================
-- PART 8: comments
-- ============================================================================

COMMENT ON TABLE business_quotations IS
  'Customer-facing priced proposals. Creates no bookings and moves no money until converted.';
COMMENT ON COLUMN business_quotations.exchange_rate IS
  'AED -> currency rate locked at creation so a PDF already sent never changes value.';
COMMENT ON COLUMN business_quotations.status IS
  'expired is intentionally absent - derived from valid_until at read time, since nothing would transition it.';
COMMENT ON COLUMN business_quotation_items.conversion_nonce IS
  'Idempotency key. Written to business_bookings.price_signature_nonce, whose partial UNIQUE index makes a duplicate conversion fail at the database instead of double-charging the wallet.';
COMMENT ON COLUMN business_quotation_items.net_total_aed IS
  'Platform cost estimate. Never rendered into the customer PDF, and always re-priced at conversion because price signatures expire after 30 minutes.';
COMMENT ON COLUMN business_quotation_items.sell_total_aed IS
  'The only money the customer ever sees.';
