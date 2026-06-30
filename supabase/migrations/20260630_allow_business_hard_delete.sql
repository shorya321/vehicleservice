-- Allow business account hard delete by changing business_bookings FK from RESTRICT to CASCADE
-- This enables admin deletion of business accounts that have existing bookings

BEGIN;

ALTER TABLE business_bookings
  DROP CONSTRAINT business_bookings_business_account_id_fkey;

ALTER TABLE business_bookings
  ADD CONSTRAINT business_bookings_business_account_id_fkey
  FOREIGN KEY (business_account_id)
  REFERENCES business_accounts(id)
  ON DELETE CASCADE;

COMMIT;
