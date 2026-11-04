-- A guest row's price signature is bound to `guest:<email>`. Re-owning it before
-- payment finalizes would make every signature check fail (unpayable booking, or a
-- charged card that never confirms). Only paid guest trips move into the account;
-- unpaid ones stay guest and link on a later visit once paid.
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

  -- Grouped trips are paid on the group; move the group and its journeys together.
  WITH paid_groups AS (
    UPDATE public.booking_groups
       SET customer_id = p_user_id, guest_email = NULL
     WHERE customer_id IS NULL
       AND lower(guest_email) = v_email
       AND payment_status = 'completed'
    RETURNING id
  )
  UPDATE public.bookings b
     SET customer_id = p_user_id, guest_email = NULL
   WHERE b.booking_group_id IN (SELECT id FROM paid_groups)
     AND b.customer_id IS NULL;

  -- Single bookings (one way, hourly), paid.
  UPDATE public.bookings
     SET customer_id = p_user_id, guest_email = NULL
   WHERE customer_id IS NULL
     AND booking_group_id IS NULL
     AND lower(guest_email) = v_email
     AND payment_status = 'completed';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.link_guest_bookings(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_guest_bookings(uuid) TO service_role;
