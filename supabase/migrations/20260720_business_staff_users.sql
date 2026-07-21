-- Business Staff Users
-- Migration: 20260720_business_staff_users
-- Date: 2026-07-20
-- Description: Lets a business account have staff members alongside its owner.
--              Reconciles business_users columns that were applied out-of-band,
--              constrains role to ('owner','staff'), and indexes the column that
--              scopes a staff member to the bookings they created.
--
--              Additive only. Existing rows are all role='owner' and keep every
--              permission they have today.

-- ============================================================================
-- PART 1: Reconcile columns applied outside the migrations folder
-- ============================================================================
-- role / is_active / updated_at already exist in the live database but have no
-- migration file. email and full_name were dropped live and are needed again to
-- render the team list (app/api/admin/businesses/[id]/approve/route.ts already
-- selects full_name and silently fails without it).

ALTER TABLE business_users ADD COLUMN IF NOT EXISTS role       TEXT        NOT NULL DEFAULT 'staff';
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS is_active  BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE business_users ADD COLUMN IF NOT EXISTS full_name  TEXT;

-- The live default is 'owner', which silently grants full tenant access to any
-- insert path that forgets to set role. Fail closed instead. The signup route
-- sets role='owner' explicitly, so the founding owner is unaffected.
ALTER TABLE business_users ALTER COLUMN role SET DEFAULT 'staff';

-- Backfill identity from profiles for rows that predate these columns.
UPDATE business_users bu
SET email     = COALESCE(bu.email, p.email),
    full_name = COALESCE(bu.full_name, p.full_name)
FROM profiles p
WHERE p.id = bu.auth_user_id
  AND (bu.email IS NULL OR bu.full_name IS NULL);

-- Founding owners with no profile row fall back to the business contact details.
UPDATE business_users bu
SET email     = COALESCE(bu.email, ba.business_email),
    full_name = COALESCE(bu.full_name, ba.contact_person_name)
FROM business_accounts ba
WHERE ba.id = bu.business_account_id
  AND (bu.email IS NULL OR bu.full_name IS NULL);

-- ============================================================================
-- PART 2: Constrain role
-- ============================================================================
-- Normalise before adding the CHECK, or it fails to validate existing rows.

UPDATE business_users SET role = 'staff' WHERE role NOT IN ('owner', 'staff');

ALTER TABLE business_users DROP CONSTRAINT IF EXISTS business_users_role_check;
ALTER TABLE business_users
  ADD CONSTRAINT business_users_role_check CHECK (role IN ('owner', 'staff'));

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================
-- business_bookings.created_by_user_id already exists and is already populated
-- on every insert; it now also scopes what a staff member is allowed to see.

CREATE INDEX IF NOT EXISTS idx_business_bookings_created_by
  ON business_bookings (created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_business_bookings_account_creator
  ON business_bookings (business_account_id, created_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_users_account_active
  ON business_users (business_account_id, is_active);

-- ============================================================================
-- PART 4: Keep updated_at current
-- ============================================================================

DROP TRIGGER IF EXISTS update_business_users_updated_at ON business_users;
CREATE TRIGGER update_business_users_updated_at
  BEFORE UPDATE ON business_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 5: Documentation
-- ============================================================================

COMMENT ON COLUMN business_users.role IS
  'owner = full access to the business account. staff = create bookings and view only the bookings they created.';
COMMENT ON COLUMN business_users.is_active IS
  'Deactivated members keep their row (preserving booking attribution) but cannot log in or call the business API.';
COMMENT ON COLUMN business_users.email IS
  'Denormalised from auth.users for the team list. auth.users remains the source of truth for login.';

-- Migration complete
