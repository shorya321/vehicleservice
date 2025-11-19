-- Business Account Approval Workflow - Database Migration
-- Migration: Add 'pending' and 'rejected' status values for business account approval workflow
-- Date: 2025-11-18
-- Description: Extends business_accounts status enum to support approval workflow
--              - Adds 'pending' status for newly registered businesses awaiting admin approval
--              - Adds 'rejected' status for businesses that were denied approval
--              - Changes default status from 'active' to 'pending' for new registrations
--              - Existing 'active' accounts remain unaffected

-- =============================================
-- Step 1: Drop existing status constraint
-- =============================================
ALTER TABLE business_accounts
  DROP CONSTRAINT IF EXISTS business_accounts_status_check;

-- =============================================
-- Step 2: Add new constraint with additional statuses
-- =============================================
ALTER TABLE business_accounts
  ADD CONSTRAINT business_accounts_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'inactive', 'rejected'));

-- =============================================
-- Step 3: Change default status for new accounts
-- =============================================
ALTER TABLE business_accounts
  ALTER COLUMN status SET DEFAULT 'pending';

-- =============================================
-- Step 4: Add index for pending status (optimization)
-- =============================================
-- This helps admins quickly find pending approvals
CREATE INDEX IF NOT EXISTS idx_business_accounts_pending
  ON business_accounts(status, created_at DESC)
  WHERE status = 'pending';

-- =============================================
-- Step 5: Add comments for new statuses
-- =============================================
COMMENT ON COLUMN business_accounts.status IS
  'Business account status:
   - pending: Newly registered, awaiting admin approval (cannot login)
   - active: Approved and active (can login and create bookings)
   - suspended: Temporarily suspended by admin (cannot login)
   - inactive: Deactivated account (cannot login)
   - rejected: Application rejected by admin (cannot login)';

-- =============================================
-- Migration Notes
-- =============================================
-- BACKWARD COMPATIBILITY:
-- - Existing accounts with status='active' are NOT affected
-- - All existing functionality continues to work
-- - Only NEW registrations will start with status='pending'
--
-- BEHAVIOR AFTER MIGRATION:
-- - New business registrations: status='pending' (awaiting approval)
-- - Existing business accounts: keep current status (typically 'active')
-- - Admin can approve: pending → active
-- - Admin can reject: pending → rejected
-- - Admin can still manually set: active/suspended/inactive as before
