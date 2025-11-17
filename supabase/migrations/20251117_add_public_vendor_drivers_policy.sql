-- Add public SELECT policy for vendor_drivers
-- Migration: 20251117_add_public_vendor_drivers_policy
-- Date: 2025-11-17
-- Description: Allow public to view vendor drivers (needed for business booking assignments)

-- This policy allows anyone to view driver information
-- Similar to how vehicles and vendor_applications have public SELECT policies

DROP POLICY IF EXISTS "Public can view all drivers" ON vendor_drivers;

CREATE POLICY "Public can view all drivers"
ON vendor_drivers
FOR SELECT
TO public
USING (true);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added public SELECT policy for vendor_drivers';
  RAISE NOTICE 'This allows business users to see driver details in booking assignments';
END $$;
