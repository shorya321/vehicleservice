-- ============================================================
-- Auto-Generate Service Codes for ALL Location Type Combinations
--
-- Fixes:
-- 1. Same-type transfers (airport→airport) no longer fall back to generic 'T'
-- 2. Extended types (metro, resort, museum, etc.) get unique service codes
-- 3. New location types auto-create service codes on first booking
-- ============================================================

-- 1. Update derive function: remove same-type restriction, auto-insert missing codes
CREATE OR REPLACE FUNCTION derive_transfer_service_code(
  p_from_location_type_id UUID,
  p_to_location_type_id UUID
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  from_abbrev TEXT;
  to_abbrev   TEXT;
  from_label  TEXT;
  to_label    TEXT;
  candidate   TEXT;
BEGIN
  SELECT abbreviation, label INTO from_abbrev, from_label
    FROM location_types WHERE id = p_from_location_type_id;
  SELECT abbreviation, label INTO to_abbrev, to_label
    FROM location_types WHERE id = p_to_location_type_id;

  IF from_abbrev IS NULL OR to_abbrev IS NULL THEN
    RETURN 'T';
  END IF;

  candidate := 'T' || from_abbrev || to_abbrev;

  -- Auto-create service code if it doesn't exist yet
  INSERT INTO service_codes (code, description, service_type)
  VALUES (
    candidate,
    'Transfer ' || COALESCE(from_label, from_abbrev) || ' to ' || COALESCE(to_label, to_abbrev),
    'transfer'
  )
  ON CONFLICT (code) DO NOTHING;

  RETURN candidate;
END;
$$;

-- 2. Pre-seed service codes for ALL active location type combinations (N×N)
INSERT INTO service_codes (code, description, service_type)
SELECT
  'T' || f.abbreviation || t.abbreviation,
  'Transfer ' || f.label || ' to ' || t.label,
  'transfer'
FROM location_types f
CROSS JOIN location_types t
WHERE f.is_active = true AND t.is_active = true
ON CONFLICT (code) DO NOTHING;

-- 3. Safety cleanup: drop old enum-based overload if it still exists
DROP FUNCTION IF EXISTS derive_transfer_service_code(location_type, location_type);
