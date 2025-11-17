-- Add RLS policy for business users to view their booking assignments
-- Migration: 20251117_add_business_booking_assignments_rls
-- Date: 2025-11-17
-- Description: Allow business users to view assignments for their business bookings

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Business users can view their booking assignments" ON booking_assignments;

-- Create policy for business users to view their booking assignments
CREATE POLICY "Business users can view their booking assignments"
ON booking_assignments
FOR SELECT
TO authenticated
USING (
  business_booking_id IN (
    SELECT bb.id
    FROM business_bookings bb
    INNER JOIN business_users bu ON bb.business_account_id = bu.business_account_id
    WHERE bu.auth_user_id = auth.uid()
  )
);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added RLS policy for business users to view booking assignments';
END $$;
