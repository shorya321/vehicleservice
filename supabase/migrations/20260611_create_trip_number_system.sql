-- ============================================================
-- Trip Number System
-- Format: INF[ServiceCode][MMYY][Seq]
-- Example: INFTAH062601 (Transfer Airport→Hotel, June 2026, #1)
-- ============================================================

-- 1. Service codes lookup table
CREATE TABLE service_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  service_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service codes readable by authenticated users"
  ON service_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin manages service codes"
  ON service_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed transfer service codes
INSERT INTO service_codes (code, description, service_type) VALUES
  ('T',   'Generic Transfer',          'transfer'),
  ('TAH', 'Transfer Airport to Hotel', 'transfer'),
  ('THA', 'Transfer Hotel to Airport', 'transfer'),
  ('TAC', 'Transfer Airport to City',  'transfer'),
  ('TCA', 'Transfer City to Airport',  'transfer'),
  ('TAS', 'Transfer Airport to Station', 'transfer'),
  ('TSA', 'Transfer Station to Airport', 'transfer'),
  ('THC', 'Transfer Hotel to City',    'transfer'),
  ('TCH', 'Transfer City to Hotel',    'transfer'),
  ('THS', 'Transfer Hotel to Station', 'transfer'),
  ('TSH', 'Transfer Station to Hotel', 'transfer'),
  ('TCS', 'Transfer City to Station',  'transfer'),
  ('TSC', 'Transfer Station to City',  'transfer');

-- Future service types (inactive)
INSERT INTO service_codes (code, description, service_type, is_active) VALUES
  ('TY', 'Transfer Yacht',   'yacht',   false),
  ('TJ', 'Transfer Jet',     'jet',     false),
  ('TD', 'Transfer Desert',  'desert',  false);

-- 2. Counter table for per-service-code-per-month sequences
CREATE TABLE trip_number_counters (
  service_code TEXT NOT NULL REFERENCES service_codes(code),
  month_year TEXT NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (service_code, month_year)
);

ALTER TABLE trip_number_counters ENABLE ROW LEVEL SECURITY;

-- No direct public access; accessed via SECURITY DEFINER functions

-- 3. Derive service code from location types
CREATE OR REPLACE FUNCTION derive_transfer_service_code(
  p_from_type location_type,
  p_to_type location_type
) RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  from_abbrev TEXT;
  to_abbrev TEXT;
  candidate TEXT;
BEGIN
  from_abbrev := CASE p_from_type
    WHEN 'airport' THEN 'A'
    WHEN 'city'    THEN 'C'
    WHEN 'hotel'   THEN 'H'
    WHEN 'station' THEN 'S'
    ELSE NULL
  END;

  to_abbrev := CASE p_to_type
    WHEN 'airport' THEN 'A'
    WHEN 'city'    THEN 'C'
    WHEN 'hotel'   THEN 'H'
    WHEN 'station' THEN 'S'
    ELSE NULL
  END;

  IF from_abbrev IS NOT NULL AND to_abbrev IS NOT NULL AND from_abbrev <> to_abbrev THEN
    candidate := 'T' || from_abbrev || to_abbrev;
    IF EXISTS (SELECT 1 FROM service_codes WHERE code = candidate AND is_active = true) THEN
      RETURN candidate;
    END IF;
  END IF;

  RETURN 'T';
END;
$$;

-- 4. Generate trip number with atomic counter increment
CREATE OR REPLACE FUNCTION generate_trip_number(
  p_service_code TEXT
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month_year TEXT;
  v_next_seq INTEGER;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'MMYY');

  INSERT INTO trip_number_counters (service_code, month_year, last_seq)
  VALUES (p_service_code, v_month_year, 1)
  ON CONFLICT (service_code, month_year)
  DO UPDATE SET last_seq = trip_number_counters.last_seq + 1
  RETURNING last_seq INTO v_next_seq;

  RETURN 'INF' || p_service_code || v_month_year || LPAD(v_next_seq::TEXT, 2, '0');
END;
$$;

-- 5. Add trip_number column to bookings
ALTER TABLE bookings ADD COLUMN trip_number TEXT UNIQUE;

-- 6. Add trip_number column to business_bookings
ALTER TABLE business_bookings ADD COLUMN trip_number TEXT UNIQUE;

-- 7. Trigger for bookings
CREATE OR REPLACE FUNCTION set_booking_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  v_from_type location_type;
  v_to_type location_type;
  v_service_code TEXT;
BEGIN
  IF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT type INTO v_from_type FROM locations WHERE id = NEW.from_location_id;
    SELECT type INTO v_to_type FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type, v_to_type);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_trip_number_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_trip_number();

-- 8. Trigger for business_bookings
CREATE OR REPLACE FUNCTION set_business_booking_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  v_from_type location_type;
  v_to_type location_type;
  v_service_code TEXT;
BEGIN
  IF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT type INTO v_from_type FROM locations WHERE id = NEW.from_location_id;
    SELECT type INTO v_to_type FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type, v_to_type);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_business_booking_trip_number_trigger
  BEFORE INSERT ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_business_booking_trip_number();

-- 9. Backfill existing customer bookings
DO $$
DECLARE
  r RECORD;
  v_from_type location_type;
  v_to_type location_type;
  v_service_code TEXT;
  v_trip TEXT;
BEGIN
  FOR r IN SELECT id, from_location_id, to_location_id FROM bookings WHERE trip_number IS NULL ORDER BY created_at
  LOOP
    IF r.from_location_id IS NOT NULL AND r.to_location_id IS NOT NULL THEN
      SELECT type INTO v_from_type FROM locations WHERE id = r.from_location_id;
      SELECT type INTO v_to_type FROM locations WHERE id = r.to_location_id;
      v_service_code := derive_transfer_service_code(v_from_type, v_to_type);
    ELSE
      v_service_code := 'T';
    END IF;
    v_trip := generate_trip_number(v_service_code);
    UPDATE bookings SET trip_number = v_trip WHERE id = r.id;
  END LOOP;
END;
$$;

-- 10. Backfill existing business bookings
DO $$
DECLARE
  r RECORD;
  v_from_type location_type;
  v_to_type location_type;
  v_service_code TEXT;
  v_trip TEXT;
BEGIN
  FOR r IN SELECT id, from_location_id, to_location_id FROM business_bookings WHERE trip_number IS NULL ORDER BY created_at
  LOOP
    IF r.from_location_id IS NOT NULL AND r.to_location_id IS NOT NULL THEN
      SELECT type INTO v_from_type FROM locations WHERE id = r.from_location_id;
      SELECT type INTO v_to_type FROM locations WHERE id = r.to_location_id;
      v_service_code := derive_transfer_service_code(v_from_type, v_to_type);
    ELSE
      v_service_code := 'T';
    END IF;
    v_trip := generate_trip_number(v_service_code);
    UPDATE business_bookings SET trip_number = v_trip WHERE id = r.id;
  END LOOP;
END;
$$;

-- 11. Make trip_number NOT NULL after backfill
ALTER TABLE bookings ALTER COLUMN trip_number SET NOT NULL;
ALTER TABLE business_bookings ALTER COLUMN trip_number SET NOT NULL;
