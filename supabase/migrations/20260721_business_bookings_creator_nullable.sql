-- Make business_bookings.created_by_user_id nullable.
--
-- The column was NOT NULL while its foreign key was declared ON DELETE SET NULL.
-- Those contradict: removing a business_users row made Postgres try to null the
-- column and raise 23502 instead, so a member who had ever created a booking
-- could not be deleted at all. That surfaced through the admin user-deletion
-- flow (app/admin/users/actions/user-delete.actions.ts), which deletes the
-- business_users row for staff members.
--
-- Dropping NOT NULL lets SET NULL behave as it was always declared to: the
-- member goes away, their bookings survive with no creator. Such bookings stop
-- matching any staff member's created_by_user_id filter and become visible to
-- the owner only, which is the intended outcome and needs no RLS change - the
-- policies in 20260721_business_role_rls.sql already compare
-- created_by_user_id = bu.id, which is null-safe.
--
-- Every insert path (the create_business_booking RPCs) still stamps the column,
-- so null means "creator was removed", never "we forgot".

ALTER TABLE public.business_bookings
  ALTER COLUMN created_by_user_id DROP NOT NULL;

COMMENT ON COLUMN public.business_bookings.created_by_user_id IS
  'business_users.id of the member who created this booking. NULL when that '
  'member has since been deleted (FK is ON DELETE SET NULL); such bookings are '
  'visible to the business owner only.';
