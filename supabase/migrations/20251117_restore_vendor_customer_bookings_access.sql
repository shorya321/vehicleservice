-- Restore vendor access to customer bookings (bookings table)
-- Migration: 20251117_restore_vendor_customer_bookings_access
-- Date: 2025-11-17
-- Description: Adds vendor SELECT policy on bookings table with non-recursive implementation

-- Background:
-- - The bookings table no longer has vendor_id column (uses booking_assignments table instead)
-- - Original vendor policy was dropped/outdated (checked vendor_id which doesn't exist)
-- - Vendors can read booking_assignments table (policy exists)
-- - Vendors can read business_bookings table (added in 20251117_restore_vendor_business_bookings_access)
-- - Vendors CANNOT read bookings table (policy missing) - THIS IS THE BUG
-- - Error: PGRST116 "The result contains 0 rows" when fetching customer bookings

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "Vendors view assigned customer bookings" ON bookings;
DROP POLICY IF EXISTS "Vendors can view their bookings" ON bookings;

-- Create non-recursive policy for vendors to view assigned customer bookings
CREATE POLICY "Vendors view assigned customer bookings"
ON bookings
FOR SELECT
TO authenticated
USING (
  -- Direct check: is this booking assigned to a vendor where user_id = current user?
  -- This is NON-RECURSIVE because:
  -- 1. It queries booking_assignments table (not bookings table)
  -- 2. booking_assignments RLS policies don't query bookings table
  -- 3. No circular dependency
  id IN (
    SELECT booking_id
    FROM booking_assignments
    WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
    AND booking_id IS NOT NULL
  )
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Restored vendor access to customer bookings';
  RAISE NOTICE 'Policy is non-recursive and allows vendors to view their assigned customer bookings';
  RAISE NOTICE 'Vendors can now see BOTH customer bookings (via bookings table) and business bookings (via business_bookings table)';
  RAISE NOTICE 'This completes the vendor booking access fix - vendors should now see all 6 bookings';
END $$;
