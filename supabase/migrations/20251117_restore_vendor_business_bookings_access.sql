-- Restore vendor access to business_bookings table
-- Migration: 20251117_restore_vendor_business_bookings_access
-- Date: 2025-11-17
-- Description: Restores vendor SELECT policy on business_bookings with non-recursive implementation

-- Background:
-- - Original policy from 20250103 had a bug (checked booking_id instead of business_booking_id)
-- - Migration 20251117_fix_business_bookings_rls_recursion dropped the policy to fix infinite recursion
-- - This broke vendor access to BOTH customer and business bookings
-- - Now restoring with correct, non-recursive implementation

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "Vendors view assigned business bookings" ON business_bookings;

-- Create non-recursive policy for vendors to view assigned business bookings
CREATE POLICY "Vendors view assigned business bookings"
ON business_bookings
FOR SELECT
TO authenticated
USING (
  -- Direct check: is this business_booking assigned to a vendor where user_id = current user?
  -- This is NON-RECURSIVE because:
  -- 1. It queries booking_assignments table (not business_bookings)
  -- 2. booking_assignments RLS policies don't query business_bookings
  -- 3. No circular dependency
  id IN (
    SELECT business_booking_id
    FROM booking_assignments
    WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
    AND business_booking_id IS NOT NULL
  )
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Restored vendor access to business_bookings';
  RAISE NOTICE 'Policy is non-recursive and allows vendors to view their assigned business bookings';
  RAISE NOTICE 'Vendors can now see both customer bookings (via bookings table) and business bookings';
END $$;
