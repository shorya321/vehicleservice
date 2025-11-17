-- Add RLS policies for business users to view vehicle and vendor info for their assigned bookings
-- Migration: 20251117_add_business_rls_for_assignments
-- Date: 2025-11-17
-- Description: Allow business users to view vehicle and vendor information when assigned to their bookings

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Business users can view vehicles assigned to their bookings" ON vehicles;
DROP POLICY IF EXISTS "Business users can view vendors assigned to their bookings" ON vendor_applications;

-- Create policy for business users to view vehicles assigned to their bookings
CREATE POLICY "Business users can view vehicles assigned to their bookings"
ON vehicles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ba.vehicle_id
    FROM booking_assignments ba
    INNER JOIN business_bookings bb ON bb.id = ba.business_booking_id
    INNER JOIN business_users bu ON bu.business_account_id = bb.business_account_id
    WHERE bu.auth_user_id = auth.uid()
      AND ba.vehicle_id IS NOT NULL
  )
);

-- Create policy for business users to view vendors assigned to their bookings
CREATE POLICY "Business users can view vendors assigned to their bookings"
ON vendor_applications
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ba.vendor_id
    FROM booking_assignments ba
    INNER JOIN business_bookings bb ON bb.id = ba.business_booking_id
    INNER JOIN business_users bu ON bu.business_account_id = bb.business_account_id
    WHERE bu.auth_user_id = auth.uid()
      AND ba.vendor_id IS NOT NULL
  )
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added RLS policies for business users to view assigned vehicles and vendors';
  RAISE NOTICE 'Business users can now view complete assignment details including vehicle and vendor information';
END $$;
