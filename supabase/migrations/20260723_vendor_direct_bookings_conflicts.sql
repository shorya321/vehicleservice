-- Vendor Direct Bookings - required resources + double-booking prevention
-- Migration: 20260723_vendor_direct_bookings_conflicts
-- Date: 2026-07-23
-- Description: Makes vehicle, driver and return time mandatory on direct bookings,
--              and stops a vehicle or driver being committed to two overlapping
--              jobs - counting ONLINE bookings and DIRECT bookings together.
--
--              Where online occupancy lives: not in bookings or booking_assignments,
--              but in resource_schedules (resource_type 'vehicle'|'driver',
--              resource_id, start_datetime, end_datetime). Rows are written only when
--              a vendor accepts an online booking and names a driver + vehicle, with
--              end = pickup + a fixed 2h estimate. Customer and B2B bookings both flow
--              through that same path, so checking resource_schedules covers both.
--
--              Two layers, because an application check alone loses the race:
--                PART 4 - EXCLUDE constraints stop direct-vs-direct overlap outright.
--                PART 5 - a trigger stops direct-vs-online overlap (an exclusion
--                         constraint cannot span tables).
--
--              Both use HALF-OPEN ranges, matching AvailabilityService.findConflicts:
--              a job ending at 16:00 does not collide with one starting at 16:00.
--
--              This migration does not read or write bookings, business_bookings,
--              booking_assignments or resource_schedules. The trigger only SELECTs
--              from resource_schedules / resource_unavailability.

-- ============================================================================
-- PART 1: Required fields
-- ============================================================================
-- Safe without a backfill: vendor_direct_bookings is empty at time of writing.
-- The guards below turn a silent data-loss migration into a loud failure if that
-- ever stops being true.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vendor_direct_bookings WHERE driver_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot set driver_id NOT NULL: % existing rows have no driver',
      (SELECT count(*) FROM vendor_direct_bookings WHERE driver_id IS NULL);
  END IF;

  IF EXISTS (SELECT 1 FROM vendor_direct_bookings WHERE return_datetime IS NULL) THEN
    RAISE EXCEPTION 'Cannot set return_datetime NOT NULL: % existing rows have no return time',
      (SELECT count(*) FROM vendor_direct_bookings WHERE return_datetime IS NULL);
  END IF;
END $$;

ALTER TABLE vendor_direct_bookings ALTER COLUMN driver_id SET NOT NULL;
ALTER TABLE vendor_direct_bookings ALTER COLUMN return_datetime SET NOT NULL;

-- The NULL branch is now dead weight.
ALTER TABLE vendor_direct_bookings
  DROP CONSTRAINT IF EXISTS vendor_direct_bookings_return_after_pickup;

ALTER TABLE vendor_direct_bookings
  ADD CONSTRAINT vendor_direct_bookings_return_after_pickup
  CHECK (return_datetime > pickup_datetime);

-- ============================================================================
-- PART 2: driver_id FK - SET NULL would now violate NOT NULL
-- ============================================================================
-- RESTRICT also matches vehicle_id: a driver carrying booking history should not
-- be quietly detachable.

ALTER TABLE vendor_direct_bookings
  DROP CONSTRAINT IF EXISTS vendor_direct_bookings_driver_id_fkey;

ALTER TABLE vendor_direct_bookings
  ADD CONSTRAINT vendor_direct_bookings_driver_id_fkey
  FOREIGN KEY (driver_id) REFERENCES vendor_drivers(id) ON DELETE RESTRICT;

-- ============================================================================
-- PART 3: btree_gist
-- ============================================================================
-- Needed so an EXCLUDE constraint can combine equality (uuid) with overlap (range).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- PART 4: Direct vs direct - exclusion constraints
-- ============================================================================
-- '[)' = half-open, so back-to-back bookings are legal.
-- The WHERE clause is what makes cancelled/completed release the resource.

ALTER TABLE vendor_direct_bookings
  DROP CONSTRAINT IF EXISTS vendor_direct_bookings_vehicle_no_overlap;

ALTER TABLE vendor_direct_bookings
  ADD CONSTRAINT vendor_direct_bookings_vehicle_no_overlap
  EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(pickup_datetime, return_datetime, '[)') WITH &&
  ) WHERE (booking_status NOT IN ('cancelled', 'completed'));

ALTER TABLE vendor_direct_bookings
  DROP CONSTRAINT IF EXISTS vendor_direct_bookings_driver_no_overlap;

ALTER TABLE vendor_direct_bookings
  ADD CONSTRAINT vendor_direct_bookings_driver_no_overlap
  EXCLUDE USING gist (
    driver_id WITH =,
    tstzrange(pickup_datetime, return_datetime, '[)') WITH &&
  ) WHERE (booking_status NOT IN ('cancelled', 'completed'));

-- ============================================================================
-- PART 5: Direct vs online - trigger
-- ============================================================================
-- resource_schedules holds accepted online bookings (customer and B2B);
-- resource_unavailability holds vendor-declared maintenance / leave / sick.
--
-- Raises 23P01 (exclusion_violation) - the same SQLSTATE the constraints in PART 4
-- produce - so the application maps one error code to one friendly message.

CREATE OR REPLACE FUNCTION validate_vendor_direct_booking_no_online_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict RECORD;
BEGIN
  -- A cancelled or completed booking occupies nothing, so it can always be saved.
  IF NEW.booking_status IN ('cancelled', 'completed') THEN
    RETURN NEW;
  END IF;

  -- Accepted online bookings, for either the vehicle or the driver.
  SELECT rs.resource_type, rs.start_datetime, rs.end_datetime
    INTO v_conflict
  FROM resource_schedules rs
  WHERE (
          (rs.resource_type = 'vehicle' AND rs.resource_id = NEW.vehicle_id)
       OR (rs.resource_type = 'driver'  AND rs.resource_id = NEW.driver_id)
        )
    AND rs.start_datetime < NEW.return_datetime
    AND rs.end_datetime   > NEW.pickup_datetime
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'This % is already committed to an online booking from % to %',
      v_conflict.resource_type, v_conflict.start_datetime, v_conflict.end_datetime
      USING ERRCODE = 'exclusion_violation';
  END IF;

  -- Vendor-declared unavailability (maintenance, leave, sick).
  SELECT ru.resource_type, ru.start_datetime, ru.end_datetime, ru.reason
    INTO v_conflict
  FROM resource_unavailability ru
  WHERE (
          (ru.resource_type = 'vehicle' AND ru.resource_id = NEW.vehicle_id)
       OR (ru.resource_type = 'driver'  AND ru.resource_id = NEW.driver_id)
        )
    AND ru.start_datetime < NEW.return_datetime
    AND ru.end_datetime   > NEW.pickup_datetime
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'This % is marked unavailable (%) from % to %',
      v_conflict.resource_type, v_conflict.reason,
      v_conflict.start_datetime, v_conflict.end_datetime
      USING ERRCODE = 'exclusion_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_vendor_direct_booking_no_online_overlap_trigger
  ON vendor_direct_bookings;

CREATE TRIGGER validate_vendor_direct_booking_no_online_overlap_trigger
  BEFORE INSERT OR UPDATE OF
    vehicle_id, driver_id, pickup_datetime, return_datetime, booking_status
  ON vendor_direct_bookings
  FOR EACH ROW EXECUTE FUNCTION validate_vendor_direct_booking_no_online_overlap();

-- ============================================================================
-- PART 6: Supporting index
-- ============================================================================
-- The trigger looks resource_schedules up by (resource_type, resource_id) on every
-- direct-booking write.

CREATE INDEX IF NOT EXISTS idx_resource_schedules_resource_window
  ON resource_schedules (resource_type, resource_id, start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_resource_unavailability_resource_window
  ON resource_unavailability (resource_type, resource_id, start_datetime, end_datetime);

-- ============================================================================
-- PART 7: Documentation
-- ============================================================================

COMMENT ON CONSTRAINT vendor_direct_bookings_vehicle_no_overlap ON vendor_direct_bookings IS
  'Stops one vehicle being double-booked across direct bookings. Half-open, so back-to-back jobs are allowed. Cancelled and completed bookings are excluded and release the vehicle.';

COMMENT ON CONSTRAINT vendor_direct_bookings_driver_no_overlap ON vendor_direct_bookings IS
  'As above, for drivers.';

COMMENT ON FUNCTION validate_vendor_direct_booking_no_online_overlap() IS
  'Blocks a direct booking whose window overlaps an accepted online booking (resource_schedules) or a declared unavailability, for either its vehicle or its driver. Raises 23P01 to match the exclusion constraints.';

COMMENT ON COLUMN vendor_direct_bookings.return_datetime IS
  'UTC, required. With pickup_datetime this forms the exact window used for conflict detection. Online bookings have no end time and fall back to a fixed 2h estimate.';

-- Migration complete
