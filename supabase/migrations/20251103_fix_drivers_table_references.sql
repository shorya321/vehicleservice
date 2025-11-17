-- Fix incorrect references to non-existent 'drivers' table
-- The correct table name is 'vendor_drivers'

-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT
-- =====================================================

-- Drop the incorrect foreign key constraint (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'booking_assignments_driver_id_fkey'
    AND table_name = 'booking_assignments'
  ) THEN
    ALTER TABLE booking_assignments
    DROP CONSTRAINT booking_assignments_driver_id_fkey;
  END IF;
END $$;

-- Create the correct foreign key constraint pointing to vendor_drivers
ALTER TABLE booking_assignments
ADD CONSTRAINT booking_assignments_driver_id_fkey
FOREIGN KEY (driver_id) REFERENCES vendor_drivers(id) ON DELETE SET NULL;

COMMENT ON CONSTRAINT booking_assignments_driver_id_fkey ON booking_assignments IS
  'Fixed 2025-11-03: Reference vendor_drivers instead of non-existent drivers table';

-- =====================================================
-- FIX RLS POLICY
-- =====================================================

-- Drop the incorrect RLS policy (if it exists)
DROP POLICY IF EXISTS "Drivers can view their assignments" ON booking_assignments;

-- Recreate the policy with correct reference to vendor_drivers
CREATE POLICY "Drivers can view their assignments"
ON booking_assignments
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM vendor_drivers
    WHERE vendor_id IN (
      SELECT id FROM vendor_applications
      WHERE user_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "Drivers can view their assignments" ON booking_assignments IS
  'Fixed 2025-11-03: Query vendor_drivers instead of non-existent drivers table';

-- =====================================================
-- FIX CUSTOMER NOTIFICATION TRIGGER FUNCTION
-- =====================================================

-- Recreate the trigger function with correct references
CREATE OR REPLACE FUNCTION notify_customer_driver_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  driver_name TEXT;
  vendor_name TEXT;
BEGIN
  -- Notify when driver is newly assigned or changed
  IF NEW.driver_id IS NOT NULL AND
     (OLD IS NULL OR OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN

    -- Get booking details
    SELECT b.booking_number INTO booking_num
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    -- Get driver name from vendor_drivers (concatenate first_name and last_name)
    SELECT vd.first_name || ' ' || vd.last_name INTO driver_name
    FROM vendor_drivers vd
    WHERE vd.id = NEW.driver_id
    LIMIT 1;

    -- Get vendor name
    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

    -- Get customer_id from booking
    PERFORM create_customer_notification(
      (SELECT customer_id FROM bookings WHERE id = NEW.booking_id LIMIT 1),
      'booking'::notification_category,
      'driver_assigned',
      'Driver Assigned',
      'Driver ' || COALESCE(driver_name, 'assigned') || ' from ' || COALESCE(vendor_name, 'vendor') ||
      ' has been assigned to your booking #' || COALESCE(booking_num, NEW.booking_id::TEXT),
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'driver_id', NEW.driver_id,
        'driver_name', driver_name,
        'vendor_id', NEW.vendor_id,
        'vendor_name', vendor_name
      ),
      '/customer/bookings/' || NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_customer_driver_assigned IS
  'Fixed 2025-11-03: Query vendor_drivers and concatenate first_name + last_name instead of using non-existent drivers.full_name';

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS trigger_notify_customer_driver_assigned ON booking_assignments;

CREATE TRIGGER trigger_notify_customer_driver_assigned
AFTER INSERT OR UPDATE ON booking_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_customer_driver_assigned();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the foreign key now points to vendor_drivers
DO $$
DECLARE
  fk_count INT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'booking_assignments'
    AND tc.constraint_name = 'booking_assignments_driver_id_fkey'
    AND ccu.table_name = 'vendor_drivers';

  IF fk_count = 0 THEN
    RAISE EXCEPTION 'Foreign key constraint was not created correctly';
  END IF;

  RAISE NOTICE 'Foreign key constraint verified successfully';
END $$;

COMMENT ON TABLE booking_assignments IS
  'Manages the assignment of bookings to vendors and tracks acceptance/rejection status. Fixed 2025-11-03: All references now point to vendor_drivers table.';
