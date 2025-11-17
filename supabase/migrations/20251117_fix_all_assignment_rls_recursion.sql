-- Fix all infinite recursion issues in assignment-related RLS policies
-- Migration: 20251117_fix_all_assignment_rls_recursion
-- Date: 2025-11-17
-- Description: Remove all circular dependencies by dropping business user policies on vendor tables

-- The root cause:
-- When booking_assignments joins vendor_drivers, vehicles, or vendor_applications:
-- 1. booking_assignments RLS policy queries business_bookings
-- 2. vendor_* RLS policy queries booking_assignments → business_bookings
-- 3. Creates infinite recursion loop (42P17)

-- Solution: Drop all three problematic policies
-- These tables already have public/vendor policies that will allow the data to be accessed
-- Business users will see the data through those existing policies

DROP POLICY IF EXISTS "Business users can view drivers assigned to their bookings" ON vendor_drivers;
DROP POLICY IF EXISTS "Business users can view vehicles assigned to their bookings" ON vehicles;
DROP POLICY IF EXISTS "Business users can view vendors assigned to their bookings" ON vendor_applications;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Dropped all circular RLS policies';
  RAISE NOTICE 'Vendor data will be accessible through existing public/vendor policies';
  RAISE NOTICE 'This fixes infinite recursion errors (42P17) on booking assignments';
END $$;
