-- Allow an applicant to edit their own vendor application while it is still pending.
--
-- The UI (app/vendor-application/edit) and the server action both require
-- status = 'pending', but every user-facing UPDATE policy on this table excluded
-- 'pending' -- only 'rejected' (owner) and 'approved' (vendor) were covered.
-- The UPDATE therefore matched zero rows, which PostgREST does not treat as an
-- error, so edits were silently discarded while the UI reported success.
--
-- WITH CHECK pins status to 'pending' and user_id to the caller, so an applicant
-- cannot self-approve or reassign the row via a hand-crafted request.

DROP POLICY IF EXISTS "Users can update pending application" ON public.vendor_applications;

CREATE POLICY "Users can update pending application"
  ON public.vendor_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
