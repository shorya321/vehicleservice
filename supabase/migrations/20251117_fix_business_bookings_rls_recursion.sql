-- Fix infinite recursion in business_bookings RLS policies
-- Migration: 20251117_fix_business_bookings_rls_recursion
-- Date: 2025-11-17
-- Description: Remove circular dependency between business_bookings and booking_assignments RLS policies

-- The issue:
-- 1. business_bookings "Vendors view assigned bookings" policy queries booking_assignments
-- 2. booking_assignments "Business users can view" policy queries business_bookings
-- 3. This creates infinite recursion (42P17 error)

-- Solution: Drop the vendor policy from business_bookings since vendors access bookings
-- through booking_assignments anyway, not directly through business_bookings

-- Drop the problematic vendor policy
DROP POLICY IF EXISTS "Vendors view assigned business bookings" ON business_bookings;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Fixed infinite recursion in business_bookings RLS policies';
  RAISE NOTICE 'Dropped "Vendors view assigned business bookings" policy to break circular dependency';
END $$;
