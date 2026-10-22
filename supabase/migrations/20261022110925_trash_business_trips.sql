-- Bulk form of trash_business_trip for the portal's bulk delete: splits the ids into trips
-- (a group, or a single ungrouped booking) and trashes them in one transaction, so the
-- request stays all or nothing like the hard delete it replaces.
CREATE OR REPLACE FUNCTION public.trash_business_trips(
  p_booking_ids uuid[],
  p_actor_auth_id uuid,
  p_actor_name text,
  p_actor_role text
) RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ids uuid[];
  v_trip record;
  v_out uuid[] := '{}';
BEGIN
  v_ids := ARRAY(SELECT DISTINCT unnest(p_booking_ids));
  IF (SELECT count(*) FROM business_bookings WHERE id = ANY(v_ids)) <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'Booking not found or already deleted';
  END IF;

  FOR v_trip IN
    SELECT array_agg(id) AS ids
    FROM business_bookings
    WHERE id = ANY(v_ids)
    GROUP BY COALESCE(booking_group_id, id)
  LOOP
    v_out := v_out || trash_business_trip(v_trip.ids, p_actor_auth_id, p_actor_name, p_actor_role);
  END LOOP;

  RETURN v_out;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trash_business_trips(uuid[], uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trash_business_trips(uuid[], uuid, text, text) TO service_role;
