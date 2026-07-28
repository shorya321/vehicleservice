-- Optimistic concurrency for vendor application review.
--
-- An applicant may edit while pending. Previously approve/reject checked only that
-- the status was still 'pending', never that the DATA was unchanged -- so an admin
-- who opened the page, then had the applicant swap in different documents, would
-- approve content they never reviewed.
--
-- The admin page now passes the updated_at it rendered; a mismatch refuses the action.
--
-- DROP + CREATE rather than CREATE OR REPLACE: adding a parameter creates a second
-- overload instead of replacing, which would leave the unguarded 2-arg version
-- callable. p_expected_updated_at is REQUIRED (no DEFAULT) so the guard fails closed.
--
-- DROP discards privileges, so the REVOKE/GRANT block is re-applied here in the same
-- transaction.

DROP FUNCTION IF EXISTS public.approve_vendor_application(uuid, text);
DROP FUNCTION IF EXISTS public.reject_vendor_application(uuid, text, text);

CREATE FUNCTION public.approve_vendor_application(
  p_application_id uuid,
  p_expected_updated_at timestamptz,
  p_admin_notes text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_status TEXT;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Authorization: admins only (service_role is trusted server-side).
  IF coalesce(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.is_admin(auth.uid())) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT user_id, status, updated_at
    INTO v_user_id, v_status, v_updated_at
  FROM vendor_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Optimistic concurrency: refuse to act on data the admin has not seen.
  IF v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN jsonb_build_object(
      'error',
      'This application was edited after you opened it. Refresh and review the current details before deciding.'
    );
  END IF;

  BEGIN
    UPDATE vendor_applications
    SET
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes,
      updated_at = NOW()
    WHERE id = p_application_id;

    UPDATE profiles
    SET
      role = 'vendor',
      updated_at = NOW()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('error', SQLERRM);
  END;
END;
$function$;

CREATE FUNCTION public.reject_vendor_application(
  p_application_id uuid,
  p_expected_updated_at timestamptz,
  p_rejection_reason text,
  p_admin_notes text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status TEXT;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Authorization: admins only (service_role is trusted server-side).
  IF coalesce(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.is_admin(auth.uid())) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT status, updated_at
    INTO v_status, v_updated_at
  FROM vendor_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Optimistic concurrency: refuse to act on data the admin has not seen.
  IF v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN jsonb_build_object(
      'error',
      'This application was edited after you opened it. Refresh and review the current details before deciding.'
    );
  END IF;

  UPDATE vendor_applications
  SET
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = p_rejection_reason,
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_application_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- DROP discarded all privileges; re-apply them here.
REVOKE EXECUTE ON FUNCTION public.approve_vendor_application(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_vendor_application(uuid, timestamptz, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_vendor_application(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_vendor_application(uuid, timestamptz, text, text) TO authenticated, service_role;
