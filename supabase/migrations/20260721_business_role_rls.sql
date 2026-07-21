-- Business Role RLS
-- Migration: 20260721_business_role_rls
-- Date: 2026-07-21
-- Description: Makes the owner/staff split real at the database level.
--
--              Both UPDATE policies below were scoped to *membership* of a
--              business, with no role check. Any staff member holding their own
--              anon session key could PATCH business_accounts straight against
--              PostgREST - wallet_balance, custom_domain, status, spending
--              limits - with the application routes entirely out of the loop.
--              business_bookings had the same shape, so staff could edit a
--              colleague's booking despite the UI scoping their list by
--              created_by_user_id.
--
--              Safe to narrow: every server path that writes these tables uses
--              the service-role client (which bypasses RLS) except
--              api/business/branding/settings, api/business/wallet/
--              notifications/preferences and api/business/wallet/
--              payment-element/charge-saved - all three of which are owner-only
--              routes.

-- ============================================================================
-- PART 1: business_accounts - owner-only updates
-- ============================================================================

DROP POLICY IF EXISTS "Business users update own account" ON business_accounts;
DROP POLICY IF EXISTS "Business owners update own account" ON business_accounts;

CREATE POLICY "Business owners update own account"
  ON business_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_accounts.id
        AND bu.role = 'owner'
        AND bu.is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_accounts.id
        AND bu.role = 'owner'
        AND bu.is_active
    )
  );

-- ============================================================================
-- PART 2: business_bookings - owner, or the member who created the booking
-- ============================================================================
-- Mirrors the application-level rule: owners manage every booking of their
-- business, staff manage only the ones they created themselves.

DROP POLICY IF EXISTS "Business users update own bookings" ON business_bookings;
DROP POLICY IF EXISTS "Business members update permitted bookings" ON business_bookings;

CREATE POLICY "Business members update permitted bookings"
  ON business_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_bookings.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_bookings.created_by_user_id = bu.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_bookings.business_account_id
        AND bu.is_active
        AND (bu.role = 'owner' OR business_bookings.created_by_user_id = bu.id)
    )
  );

-- Migration complete
