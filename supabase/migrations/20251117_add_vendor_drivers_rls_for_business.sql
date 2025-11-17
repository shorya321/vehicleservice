-- Add RLS policy for business users to view drivers assigned to their bookings
-- Migration: 20251117_add_vendor_drivers_rls_for_business
-- Date: 2025-11-17
-- Description: Allow business users to view driver information when driver is assigned to their booking

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Business users can view drivers assigned to their bookings" ON vendor_drivers;

-- Create policy for business users to view drivers assigned to their bookings
CREATE POLICY "Business users can view drivers assigned to their bookings"
ON vendor_drivers
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ba.driver_id
    FROM booking_assignments ba
    INNER JOIN business_bookings bb ON bb.id = ba.business_booking_id
    INNER JOIN business_users bu ON bu.business_account_id = bb.business_account_id
    WHERE bu.auth_user_id = auth.uid()
      AND ba.driver_id IS NOT NULL
  )
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added RLS policy for business users to view assigned drivers';
  RAISE NOTICE 'Business users can now view driver information for their bookings';
END $$;
