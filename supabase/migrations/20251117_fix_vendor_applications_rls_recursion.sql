-- Fix infinite recursion in vendor_applications RLS policy
-- Migration: 20251117_fix_vendor_applications_rls_recursion
-- Date: 2025-11-17
-- Description: Remove circular dependency by dropping the problematic policy

-- The issue:
-- 1. booking_assignments policy queries business_bookings
-- 2. vendor_applications policy queries booking_assignments
-- 3. When joining vendor from booking_assignments, creates infinite loop

-- Solution: Drop the vendor_applications policy for business users
-- Business users don't need direct access to vendor_applications table
-- They can see vendor info through the booking_assignments join which already works

DROP POLICY IF EXISTS "Business users can view vendors assigned to their bookings" ON vendor_applications;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Dropped problematic vendor_applications RLS policy';
  RAISE NOTICE 'Vendor information will be accessible through public policy for approved vendors';
END $$;
