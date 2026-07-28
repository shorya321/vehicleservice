-- Audit applicant edits to a pending vendor application.
--
-- Applicants are `customer` role, and the only INSERT policy on user_activity_logs
-- is admin-only, so the TypeScript logUserActivity() helper cannot be used here --
-- it would silently fail. This trigger is SECURITY DEFINER owned by postgres, so it
-- bypasses RLS (user_activity_logs has relforcerowsecurity = false), cannot be
-- forged by the client, and captures every edit path rather than one server action.
--
-- Mirrors the existing AFTER UPDATE / SECURITY DEFINER pattern already on this table
-- (notify_vendor_application_status).
--
-- The body is wrapped in an exception handler on purpose: a failure to write the
-- audit row must never abort the applicant's edit.
--
-- Note: use array_append(), not `v_changed || 'literal'` -- the untyped literal makes
-- Postgres resolve that as array || array and raise "malformed array literal".

CREATE OR REPLACE FUNCTION public.audit_vendor_application_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_changed text[] := '{}';
BEGIN
  -- Only log applicant edits: the row must be pending both before and after.
  -- This excludes admin approve/reject, which also bump updated_at.
  IF OLD.status IS DISTINCT FROM 'pending' OR NEW.status IS DISTINCT FROM 'pending' THEN
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

  -- Nothing meaningful changed (e.g. a bare updated_at touch).
  IF array_length(v_changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Field NAMES only -- license numbers and banking details are deliberately not
  -- duplicated into a second table.
  INSERT INTO public.user_activity_logs (user_id, action, details, created_by)
  VALUES (
    NEW.user_id,
    'vendor_application_edited',
    jsonb_build_object(
      'application_id', NEW.id,
      'changed_fields', to_jsonb(v_changed),
      'edited_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Auditing is best-effort; never block the applicant's edit.
  RAISE WARNING 'vendor application audit failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_audit_vendor_application_edit ON public.vendor_applications;

CREATE TRIGGER trigger_audit_vendor_application_edit
  AFTER UPDATE ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_vendor_application_edit();
