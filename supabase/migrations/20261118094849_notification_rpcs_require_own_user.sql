-- Both functions trusted p_user_id. All app callers pass the signed-in user's own id via the user client,
-- so requiring p_user_id = auth.uid() changes nothing for real users.
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id uuid)
 RETURNS notification_preferences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_preferences public.notification_preferences;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;

  RETURN v_preferences;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id uuid, p_category notification_category DEFAULT NULL::notification_category)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_category IS NULL THEN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND category = p_category AND is_read = false;
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_notification_preferences(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid, notification_category) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_or_create_notification_preferences(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid, notification_category) TO authenticated, service_role;