-- B2B Business Account Module - Row Level Security Policies
-- Migration: Create RLS policies for business tables
-- Date: 2025-01-03
-- Description: Implements strict data isolation between businesses

-- =============================================
-- ENABLE RLS on all business tables
-- =============================================
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLICIES: business_accounts
-- =============================================

-- Business users can view their own business account
CREATE POLICY "Business users view own account"
  ON business_accounts FOR SELECT
  USING (
    id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Business users can update their own business account (limited fields)
CREATE POLICY "Business users update own account"
  ON business_accounts FOR UPDATE
  USING (
    id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all business accounts
CREATE POLICY "Admins view all business accounts"
  ON business_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any business account
CREATE POLICY "Admins update all business accounts"
  ON business_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert business accounts
CREATE POLICY "Admins insert business accounts"
  ON business_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- POLICIES: business_users
-- =============================================

-- Users can view their own business user record
CREATE POLICY "Users view own business user record"
  ON business_users FOR SELECT
  USING (auth_user_id = auth.uid());

-- Users in same business can view each other (for future multi-user support)
CREATE POLICY "Business users view same business users"
  ON business_users FOR SELECT
  USING (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all business users
CREATE POLICY "Admins view all business users"
  ON business_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert business users
CREATE POLICY "Admins insert business users"
  ON business_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- POLICIES: business_bookings
-- =============================================

-- Business users can view their own business bookings
CREATE POLICY "Business users view own bookings"
  ON business_bookings FOR SELECT
  USING (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Business users can create bookings for their business
CREATE POLICY "Business users create bookings"
  ON business_bookings FOR INSERT
  WITH CHECK (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Business users can update their own business bookings
CREATE POLICY "Business users update own bookings"
  ON business_bookings FOR UPDATE
  USING (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all business bookings
CREATE POLICY "Admins view all business bookings"
  ON business_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all business bookings
CREATE POLICY "Admins update all business bookings"
  ON business_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Vendors can view bookings assigned to them
CREATE POLICY "Vendors view assigned bookings"
  ON business_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN vendor_applications va ON va.user_id = p.id
      INNER JOIN booking_assignments ba ON ba.vendor_id = va.id
      WHERE p.id = auth.uid()
        AND p.role = 'vendor'
        AND ba.booking_id = business_bookings.id
        AND ba.status IN ('pending', 'accepted')
    )
  );

-- =============================================
-- POLICIES: wallet_transactions
-- =============================================

-- Business users can view their own wallet transactions
CREATE POLICY "Business users view own transactions"
  ON wallet_transactions FOR SELECT
  USING (
    business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all wallet transactions
CREATE POLICY "Admins view all transactions"
  ON wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No direct INSERT/UPDATE/DELETE on wallet_transactions
-- (only via database functions)

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON POLICY "Business users view own account" ON business_accounts IS
  'Business users can only view their own business account information';

COMMENT ON POLICY "Admins view all business accounts" ON business_accounts IS
  'Admins have full visibility of all business accounts';

COMMENT ON POLICY "Business users view own bookings" ON business_bookings IS
  'Business users can only see bookings created by their business';

COMMENT ON POLICY "Vendors view assigned bookings" ON business_bookings IS
  'Vendors can view business bookings that have been assigned to them by admin';

COMMENT ON POLICY "Business users view own transactions" ON wallet_transactions IS
  'Business users can view their wallet transaction history';
