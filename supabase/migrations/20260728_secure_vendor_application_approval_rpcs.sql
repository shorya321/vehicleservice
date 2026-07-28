-- SECURITY FIX: approve_vendor_application / reject_vendor_application were
-- SECURITY DEFINER with no authorization check and EXECUTE granted to `anon`,
-- so any visitor could approve a pending application and promote that user's
-- profile role to 'vendor'.
--
-- The admin check existed in 20250107_create_vendor_applications.sql but was
-- overwritten by the later 20250107_add_updated_at_and_functions.sql revision.
-- This restores it and removes the anon grant.
--
-- Function bodies are otherwise unchanged. The 'Unauthorized' error is returned
-- in the same jsonb {error} shape the existing callers already handle
-- (app/admin/vendor-applications/[id]/actions.ts), so no client change is needed.
--
-- service_role is allowed through: that key is server-only and already bypasses
-- RLS entirely, so denying it would add no security while breaking admin tooling.

CREATE OR REPLACE FUNCTION public.approve_vendor_application(
  p_application_id uuid,
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
BEGIN
  -- Authorization: admins only (service_role is trusted server-side).
  IF coalesce(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.is_admin(auth.uid())) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Get the application details
  SELECT user_id, status INTO v_user_id, v_status
  FROM vendor_applications
  WHERE id = p_application_id;

  -- Check if application exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Start transaction
  BEGIN
    -- Update application status
    UPDATE vendor_applications
    SET
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      admin_notes = p_admin_notes,
      updated_at = NOW()
    WHERE id = p_application_id;

    -- Update user role to vendor
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

CREATE OR REPLACE FUNCTION public.reject_vendor_application(
  p_application_id uuid,
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
BEGIN
  -- Authorization: admins only (service_role is trusted server-side).
  IF coalesce(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.is_admin(auth.uid())) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Get the application status
  SELECT status INTO v_status
  FROM vendor_applications
  WHERE id = p_application_id;

  -- Check if application exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  -- Check if already processed
  IF v_status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Application already processed');
  END IF;

  -- Update application status
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

-- Remove the anonymous execute grant; keep authenticated (gated by the check above)
-- and service_role.
REVOKE EXECUTE ON FUNCTION public.approve_vendor_application(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_vendor_application(uuid, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_vendor_application(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_vendor_application(uuid, text, text) TO authenticated, service_role;
