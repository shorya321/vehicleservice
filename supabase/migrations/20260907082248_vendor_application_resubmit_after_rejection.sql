-- Let a rejected vendor applicant fix and resubmit the same application row.
--
-- One application per user stays the model: `one_application_per_user` and the INSERT
-- policy are untouched. What changes is that the owner of a rejected row may now put it
-- back into the queue, and that the decision it carried is archived rather than lost.

-- 1. Where a superseded decision goes.
ALTER TABLE public.vendor_applications
  ADD COLUMN IF NOT EXISTS review_history jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.vendor_applications.review_history IS
  'Append-only log of superseded decisions, written by archive_vendor_application_review() '
  'when the applicant resubmits. The admin re-reviewing needs the prior rejection reason, '
  'and the applicant needs to keep reading the feedback after the live one is cleared.';

-- 2. The owner of a rejected row may set it back to pending.
--
-- The old policy pinned WITH CHECK to status = 'rejected', so the flip raised 42501 and
-- the policy had no reachable caller. 'approved' stays unreachable, which is the only
-- transition that would matter.
DROP POLICY IF EXISTS "Users can update rejected application" ON public.vendor_applications;

CREATE POLICY "Users can resubmit rejected application"
  ON public.vendor_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'rejected')
  WITH CHECK (auth.uid() = user_id AND status IN ('rejected', 'pending'));

-- 3. Archive and clear the decision on resubmission.
--
-- In the database rather than in the server action, so the invariant holds for any writer
-- and cannot be forgotten at a call site.
CREATE OR REPLACE FUNCTION public.archive_vendor_application_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    NEW.review_history := COALESCE(OLD.review_history, '[]'::jsonb) || jsonb_build_object(
      'status',           OLD.status,
      'rejection_reason', OLD.rejection_reason,
      'admin_notes',      OLD.admin_notes,
      'reviewed_at',      OLD.reviewed_at,
      'reviewed_by',      OLD.reviewed_by,
      'resubmitted_at',   now()
    );

    NEW.rejection_reason := NULL;
    NEW.reviewed_at      := NULL;
    NEW.reviewed_by      := NULL;
    NEW.admin_notes      := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_archive_vendor_application_review ON public.vendor_applications;

CREATE TRIGGER trigger_archive_vendor_application_review
  BEFORE UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_vendor_application_review();

-- 4. Audit the resubmission.
--
-- The existing guard returns early unless the row is pending on both sides, which is
-- correct for excluding admin approve and reject but also silently drops a resubmission.
-- The pending-both-sides branch below is unchanged; the resubmit case is a second way in.
CREATE OR REPLACE FUNCTION public.audit_vendor_application_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_changed text[] := '{}';
  v_resubmitted boolean := (OLD.status = 'rejected' AND NEW.status = 'pending');
BEGIN
  -- Only log applicant writes: an edit of a pending row, or a resubmission of a rejected
  -- one. This excludes admin approve/reject, which also bump updated_at.
  IF NOT v_resubmitted
     AND (OLD.status IS DISTINCT FROM 'pending' OR NEW.status IS DISTINCT FROM 'pending') THEN
    RETURN NEW;
  END IF;

  IF NEW.business_name         IS DISTINCT FROM OLD.business_name         THEN v_changed := array_append(v_changed, 'business_name'); END IF;
  IF NEW.business_email        IS DISTINCT FROM OLD.business_email        THEN v_changed := array_append(v_changed, 'business_email'); END IF;
  IF NEW.business_phone        IS DISTINCT FROM OLD.business_phone        THEN v_changed := array_append(v_changed, 'business_phone'); END IF;
  IF NEW.business_address      IS DISTINCT FROM OLD.business_address      THEN v_changed := array_append(v_changed, 'business_address'); END IF;
  IF NEW.business_city         IS DISTINCT FROM OLD.business_city         THEN v_changed := array_append(v_changed, 'business_city'); END IF;
  IF NEW.business_country_code IS DISTINCT FROM OLD.business_country_code THEN v_changed := array_append(v_changed, 'business_country_code'); END IF;
  IF NEW.business_description  IS DISTINCT FROM OLD.business_description  THEN v_changed := array_append(v_changed, 'business_description'); END IF;
  IF NEW.registration_number   IS DISTINCT FROM OLD.registration_number   THEN v_changed := array_append(v_changed, 'registration_number'); END IF;
  IF NEW.documents             IS DISTINCT FROM OLD.documents             THEN v_changed := array_append(v_changed, 'documents'); END IF;
  IF NEW.banking_details       IS DISTINCT FROM OLD.banking_details       THEN v_changed := array_append(v_changed, 'banking_details'); END IF;

  -- Nothing meaningful changed (e.g. a bare updated_at touch). A resubmission is worth
  -- logging even when no field moved: the status did.
  IF array_length(v_changed, 1) IS NULL AND NOT v_resubmitted THEN
    RETURN NEW;
  END IF;

  -- Field NAMES only -- license numbers and banking details are deliberately not
  -- duplicated into a second table.
  INSERT INTO public.user_activity_logs (user_id, action, details, created_by)
  VALUES (
    NEW.user_id,
    CASE WHEN v_resubmitted THEN 'vendor_application_resubmitted' ELSE 'vendor_application_edited' END,
    jsonb_build_object(
      'application_id', NEW.id,
      'changed_fields', to_jsonb(v_changed),
      'edited_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Auditing is best-effort; never block the applicant's write.
  RAISE WARNING 'vendor application audit failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 5. Notify the right people, at the right link.
--
-- Two faults on the resubmit path: the applicant was sent to /vendor/dashboard, which a
-- customer cannot open, and no admin was told at all, because only INSERT notifies them.
CREATE OR REPLACE FUNCTION public.notify_vendor_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  status_label TEXT;
  message_text TEXT;
  link_url TEXT;
BEGIN
  IF NEW.status != OLD.status THEN
    status_label := CASE NEW.status
      WHEN 'approved' THEN 'Approved'
      WHEN 'rejected' THEN 'Rejected'
      WHEN 'pending' THEN 'Pending Review'
      ELSE NEW.status
    END;

    message_text := CASE
      WHEN NEW.status = 'approved' THEN 'Congratulations! Your vendor application has been approved. You can now start managing bookings.'
      WHEN NEW.status = 'rejected' THEN 'Your vendor application has been reviewed. Open your application to read the decision.'
      WHEN NEW.status = 'pending' AND OLD.status = 'rejected' THEN 'Your updated application is back with our team for review.'
      ELSE 'Your vendor application status has been updated to: ' || status_label
    END;

    -- Only an approved applicant has the vendor role the dashboard requires.
    link_url := CASE WHEN NEW.status = 'approved' THEN '/vendor/dashboard' ELSE '/vendor-application' END;

    PERFORM create_vendor_notification(
      NEW.id,
      'vendor_application'::notification_category,
      'application_status_changed',
      'Application Status: ' || status_label,
      message_text,
      jsonb_build_object(
        'application_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      link_url
    );

    -- Put the row back in front of an admin. notify_new_vendor_application() covers the
    -- first submission only, because it fires on INSERT.
    IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
      PERFORM create_admin_notification(
        'vendor_application'::notification_category,
        'application_resubmitted',
        'Vendor Application Resubmitted',
        COALESCE(NEW.business_name, 'A vendor') || ' has updated and resubmitted their application',
        jsonb_build_object(
          'application_id', NEW.id,
          'business_name', NEW.business_name,
          'user_id', NEW.user_id
        ),
        '/admin/vendor-applications/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
