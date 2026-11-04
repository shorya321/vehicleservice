-- Guest checkout (customer side only). Business objects are not touched.

-- 1. Guest marker: a booking with no account carries the email it was made with.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.booking_groups ADD COLUMN IF NOT EXISTS guest_email text;

COMMENT ON COLUMN public.bookings.guest_email IS
  'Set only for guest checkout (customer_id IS NULL). Lowercased. Cleared when link_guest_bookings attaches the booking to a verified account.';
COMMENT ON COLUMN public.booking_groups.guest_email IS
  'Set only for guest checkout (customer_id IS NULL). Lowercased. Cleared when link_guest_bookings attaches the trip to a verified account.';

CREATE INDEX IF NOT EXISTS bookings_guest_email_idx
  ON public.bookings (lower(guest_email)) WHERE customer_id IS NULL;
CREATE INDEX IF NOT EXISTS booking_groups_guest_email_idx
  ON public.booking_groups (lower(guest_email)) WHERE customer_id IS NULL;

-- 2. A guest has no notifications inbox. notifications.user_id is NOT NULL, so an
--    unguarded insert would make the paid pending -> confirmed update fail.
CREATE OR REPLACE FUNCTION public.create_customer_notification(p_user_id uuid, p_category notification_category, p_type text, p_title text, p_message text, p_data jsonb DEFAULT NULL::jsonb, p_link text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Guest bookings have no account to notify.
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert notification for the customer
  INSERT INTO notifications (
    user_id,
    category,
    type,
    title,
    message,
    data,
    link,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_category,
    p_type,
    p_title,
    p_message,
    p_data,
    p_link,
    FALSE,
    NOW()
  );
END;
$function$;

-- 3. Booking trash: name a guest trip by its passenger, and let it be restored.
--    Each function is patched in place on one exact anchor so nothing else moves
--    (the business branch of restore_trashed_trip stays byte-identical).
DO $migration$
DECLARE
  d text;
  anchor text;
BEGIN
  d := pg_get_functiondef('public.trash_customer_trip(uuid[], uuid, text, text)'::regprocedure);
  anchor := $a$'customer_name', (SELECT COALESCE(full_name, email) FROM profiles WHERE id = v_first.customer_id),$a$;
  IF position(anchor IN d) = 0 THEN
    RAISE EXCEPTION 'trash_customer_trip: anchor not found';
  END IF;
  d := replace(d, anchor,
    $r$'customer_name', COALESCE(
        (SELECT COALESCE(full_name, email) FROM profiles WHERE id = v_first.customer_id),
        (SELECT NULLIF(btrim(first_name || ' ' || last_name), '') FROM booking_passengers
          WHERE booking_id = v_first.id AND is_primary IS TRUE ORDER BY created_at LIMIT 1),
        v_first.guest_email),$r$);
  EXECUTE d;

  d := pg_get_functiondef('public.restore_trashed_trip(uuid, uuid, uuid, text, text)'::regprocedure);
  anchor := 'IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = t.customer_id) THEN';
  IF position(anchor IN d) = 0 THEN
    RAISE EXCEPTION 'restore_trashed_trip: anchor not found';
  END IF;
  d := replace(d, anchor,
    'IF t.customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = t.customer_id) THEN');
  EXECUTE d;
END
$migration$;

-- 4. Attach guest bookings to an account once its email is verified.
CREATE OR REPLACE FUNCTION public.link_guest_bookings(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_email text;
  v_count integer := 0;
BEGIN
  SELECT lower(p.email) INTO v_email
  FROM public.profiles p
  WHERE p.id = p_user_id
    AND p.role = 'customer'
    AND p.email_verified IS TRUE;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.booking_groups
     SET customer_id = p_user_id, guest_email = NULL
   WHERE customer_id IS NULL AND lower(guest_email) = v_email;

  UPDATE public.bookings
     SET customer_id = p_user_id, guest_email = NULL
   WHERE customer_id IS NULL AND lower(guest_email) = v_email;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.link_guest_bookings(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_guest_bookings(uuid) TO service_role;
