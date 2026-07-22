-- Vendor Direct Bookings
-- Migration: 20260722_vendor_direct_bookings
-- Date: 2026-07-22
-- Description: Adds an offline/direct booking module for vendors.
--
--              When a customer contacts a vendor directly - phone, walk-in, a
--              repeat client - that job has nowhere to live today. Vendors only
--              see work the platform assigned to them, via booking_assignments
--              against bookings / business_bookings. Everything else is on paper.
--
--              This table is deliberately INDEPENDENT of the online flow. It is
--              never read or written by the checkout path, the payment webhook,
--              the assignment flow, or lib/bookings/unified-service.ts. No
--              existing table is altered by this migration. The only coupling is
--              outbound: FKs to vehicles and vendor_drivers, so vendors reuse
--              their real fleet instead of retyping it.
--
--              Note on the ownership trigger in PART 4: the FKs alone only prove
--              a vehicle exists, not that it belongs to the booking's vendor. The
--              server actions re-query both scoped by vendor_id, but those
--              actions may run through the service-role client, which bypasses
--              RLS entirely. The trigger is the backstop that makes cross-vendor
--              attachment impossible regardless of which client writes the row.

-- ============================================================================
-- PART 1: Table
-- ============================================================================
-- vendor_id -> vendor_applications: there is no `vendors` table in this schema;
-- the approved application row IS the vendor.
--
-- Note the two fleet tables disagree on their FK column name, which is why the
-- ownership checks below look asymmetric: vehicles.business_id and
-- vendor_drivers.vendor_id both point at vendor_applications.id.
--
-- booking_status / payment_status are TEXT + CHECK, not enums. Enum types named
-- booking_status and payment_status do exist in this database but neither
-- booking table uses them, and the project has been actively dropping enums.

CREATE TABLE IF NOT EXISTS vendor_direct_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  vendor_id UUID NOT NULL REFERENCES vendor_applications(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL UNIQUE,

  -- Customer is denormalized on purpose. An offline customer has no account and
  -- creating a profiles row for them would leak them into the online flow.
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_notes TEXT,

  -- RESTRICT, not CASCADE: deleting a vehicle must not silently erase the
  -- booking history that justifies its revenue.
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES vendor_drivers(id) ON DELETE SET NULL,

  -- Stored UTC. The vendor enters Asia/Dubai wall-clock; conversion happens in
  -- the server action via bookingWallClockToUtc() (lib/utils/timezone.ts).
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ,

  pickup_location TEXT NOT NULL,
  dropoff_location TEXT,

  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  -- All money in this platform is AED; multi-currency is display-only. The
  -- column exists so a future per-vendor currency does not need a backfill.
  currency TEXT NOT NULL DEFAULT 'AED',

  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('cash', 'bank_transfer', 'card', 'other')),

  booking_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (booking_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  cancellation_reason TEXT,

  internal_notes TEXT,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT vendor_direct_bookings_return_after_pickup
    CHECK (return_datetime IS NULL OR return_datetime > pickup_datetime),
  CONSTRAINT vendor_direct_bookings_paid_within_total
    CHECK (amount_paid <= total_price),
  CONSTRAINT vendor_direct_bookings_cancellation_reason_present
    CHECK (booking_status <> 'cancelled' OR NULLIF(TRIM(cancellation_reason), '') IS NOT NULL)
);

-- ============================================================================
-- PART 2: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vendor_direct_bookings_vendor_pickup
  ON vendor_direct_bookings (vendor_id, pickup_datetime DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_direct_bookings_vendor_status
  ON vendor_direct_bookings (vendor_id, booking_status);

CREATE INDEX IF NOT EXISTS idx_vendor_direct_bookings_vehicle
  ON vendor_direct_bookings (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vendor_direct_bookings_driver
  ON vendor_direct_bookings (driver_id);

-- ============================================================================
-- PART 3: Reference number + updated_at
-- ============================================================================
-- Format DB-YYYYMMDD-NNNN. Mirrors generate_business_booking_number(), but pads
-- to 4 digits rather than the 2 used by generate_trip_number() - that one
-- outgrows its own format on the 100th row of a period.
--
-- The sequence is global, not per-day, so the NNNN segment is monotonic across
-- dates rather than restarting. That keeps allocation atomic under concurrency;
-- uniqueness, not density, is the requirement.

CREATE SEQUENCE IF NOT EXISTS vendor_direct_booking_ref_seq;

CREATE OR REPLACE FUNCTION generate_vendor_direct_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'DB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                            LPAD(NEXTVAL('vendor_direct_booking_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_vendor_direct_booking_reference ON vendor_direct_bookings;
CREATE TRIGGER set_vendor_direct_booking_reference
  BEFORE INSERT ON vendor_direct_bookings
  FOR EACH ROW EXECUTE FUNCTION generate_vendor_direct_booking_reference();

-- Reuses the shared function from 20250103_create_business_accounts.sql.
DROP TRIGGER IF EXISTS update_vendor_direct_bookings_updated_at ON vendor_direct_bookings;
CREATE TRIGGER update_vendor_direct_bookings_updated_at
  BEFORE UPDATE ON vendor_direct_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 4: Cross-vendor ownership guard
-- ============================================================================
-- Refuses any row whose vehicle or driver belongs to a different vendor. This
-- holds even for the service-role client, which is the whole point.

CREATE OR REPLACE FUNCTION validate_vendor_direct_booking_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = NEW.vehicle_id
      AND vehicles.business_id = NEW.vendor_id
  ) THEN
    RAISE EXCEPTION 'Vehicle % does not belong to vendor %', NEW.vehicle_id, NEW.vendor_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.driver_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM vendor_drivers
    WHERE vendor_drivers.id = NEW.driver_id
      AND vendor_drivers.vendor_id = NEW.vendor_id
  ) THEN
    RAISE EXCEPTION 'Driver % does not belong to vendor %', NEW.driver_id, NEW.vendor_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_vendor_direct_booking_ownership_trigger ON vendor_direct_bookings;
CREATE TRIGGER validate_vendor_direct_booking_ownership_trigger
  BEFORE INSERT OR UPDATE OF vendor_id, vehicle_id, driver_id ON vendor_direct_bookings
  FOR EACH ROW EXECUTE FUNCTION validate_vendor_direct_booking_ownership();

-- ============================================================================
-- PART 5: RLS
-- ============================================================================
-- The vendor subquery is NON-RECURSIVE: it reads vendor_applications, which has
-- no policy referring back to vendor_direct_bookings. Policy recursion has bitten
-- this schema repeatedly - see the several fix_*_recursion migrations.

ALTER TABLE vendor_direct_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view own direct bookings" ON vendor_direct_bookings;
CREATE POLICY "Vendors view own direct bookings"
  ON vendor_direct_bookings FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_applications WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors create own direct bookings" ON vendor_direct_bookings;
CREATE POLICY "Vendors create own direct bookings"
  ON vendor_direct_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_applications WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors update own direct bookings" ON vendor_direct_bookings;
CREATE POLICY "Vendors update own direct bookings"
  ON vendor_direct_bookings FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_applications WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_applications WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors delete own direct bookings" ON vendor_direct_bookings;
CREATE POLICY "Vendors delete own direct bookings"
  ON vendor_direct_bookings FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_applications WHERE user_id = auth.uid())
  );

-- Read-only for platform admins: support and oversight, no admin editing UI in v1.
DROP POLICY IF EXISTS "Admins view all direct bookings" ON vendor_direct_bookings;
CREATE POLICY "Admins view all direct bookings"
  ON vendor_direct_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PART 6: Documentation
-- ============================================================================

COMMENT ON TABLE vendor_direct_bookings IS
  'Offline/direct bookings a vendor records manually. Deliberately independent of bookings and business_bookings: no shared reads, writes, revenue totals, or availability checks. Vehicles and drivers are referenced from the vendor''s real fleet.';

COMMENT ON COLUMN vendor_direct_bookings.vendor_id IS
  'vendor_applications.id - the approved application row is the vendor entity.';

COMMENT ON COLUMN vendor_direct_bookings.pickup_datetime IS
  'UTC. Entered as Asia/Dubai wall-clock and converted by bookingWallClockToUtc().';

COMMENT ON COLUMN vendor_direct_bookings.customer_name IS
  'Denormalized. Offline customers have no profiles row by design.';

COMMENT ON COLUMN vendor_direct_bookings.created_by IS
  'auth.users.id of the vendor user who recorded the booking. Audit only.';

-- Migration complete
