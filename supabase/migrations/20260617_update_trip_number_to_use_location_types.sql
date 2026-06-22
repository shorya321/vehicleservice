-- ============================================================
-- Update Trip Number System to use location_types table
-- Replaces enum-based derive_transfer_service_code with
-- UUID-based version that reads abbreviation from location_types.
-- ============================================================

-- 1. Create new UUID-based overload of derive_transfer_service_code
CREATE OR REPLACE FUNCTION derive_transfer_service_code(
  p_from_location_type_id UUID,
  p_to_location_type_id UUID
) RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  from_abbrev TEXT;
  to_abbrev TEXT;
  candidate TEXT;
BEGIN
  SELECT abbreviation INTO from_abbrev FROM location_types WHERE id = p_from_location_type_id;
  SELECT abbreviation INTO to_abbrev FROM location_types WHERE id = p_to_location_type_id;

  IF from_abbrev IS NOT NULL AND to_abbrev IS NOT NULL AND from_abbrev <> to_abbrev THEN
    candidate := 'T' || from_abbrev || to_abbrev;
    IF EXISTS (SELECT 1 FROM service_codes WHERE code = candidate AND is_active = true) THEN
      RETURN candidate;
    END IF;
  END IF;

  RETURN 'T';
END;
$$;

-- 2. Update booking trigger to use location_type_id
CREATE OR REPLACE FUNCTION set_booking_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  v_from_type_id UUID;
  v_to_type_id UUID;
  v_service_code TEXT;
BEGIN
  IF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT location_type_id INTO v_from_type_id FROM locations WHERE id = NEW.from_location_id;
    SELECT location_type_id INTO v_to_type_id FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type_id, v_to_type_id);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update business booking trigger to use location_type_id
CREATE OR REPLACE FUNCTION set_business_booking_trip_number()
RETURNS TRIGGER AS $$
DECLARE
  v_from_type_id UUID;
  v_to_type_id UUID;
  v_service_code TEXT;
BEGIN
  IF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT location_type_id INTO v_from_type_id FROM locations WHERE id = NEW.from_location_id;
    SELECT location_type_id INTO v_to_type_id FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type_id, v_to_type_id);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop old enum-based overload (only used by triggers which are now updated)
DROP FUNCTION IF EXISTS derive_transfer_service_code(location_type, location_type);
