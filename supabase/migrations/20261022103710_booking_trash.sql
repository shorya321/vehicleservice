-- Booking trash: a deleted trip is snapshotted into deleted_bookings and can be restored
-- for 30 days. The live tables keep hard-delete semantics, so no read path has to learn
-- to skip trashed rows.
--
-- Additive except for one guard line added to eight INSERT trigger functions, which makes
-- them stand down while restore_trashed_trip re-inserts a snapshot (so a restored booking
-- keeps its trip number and nobody gets a second "New Booking" bell). Normal inserts never
-- set app.restoring_booking, so they behave exactly as before.

-- 1. Quotation tombstone ------------------------------------------------------------------
-- converted_booking_id must be cleared to delete the booking (ON DELETE RESTRICT), but an
-- item without it reads as unconverted and could be converted (and charged) again. This
-- column keeps the item locked after its booking is gone.
ALTER TABLE public.business_quotation_items
  ADD COLUMN IF NOT EXISTS converted_booking_removed_at timestamptz;

-- 2. Trash table -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deleted_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('business', 'customer')),
  business_account_id uuid REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  customer_id uuid,
  trip_type text,
  trip_label text NOT NULL,
  booking_ids uuid[] NOT NULL,
  pickup_datetime timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot jsonb NOT NULL,
  deleted_by uuid,
  deleted_by_name text,
  deleted_by_role text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT deleted_bookings_source_account CHECK ((source = 'business') = (business_account_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS deleted_bookings_account_idx
  ON public.deleted_bookings (business_account_id, deleted_at DESC);
CREATE INDEX IF NOT EXISTS deleted_bookings_expires_idx
  ON public.deleted_bookings (expires_at);

-- Service role only: every read and write goes through server code that scopes by account.
ALTER TABLE public.deleted_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deleted_bookings FROM anon, authenticated;

-- 3. Restore guard on INSERT triggers ----------------------------------------------------
-- Inserts "IF restoring THEN RETURN NEW" as the first statement of each body. The outer
-- BEGIN is the only unindented one in all eight functions.
DO $guard$
DECLARE
  fn text;
  def text;
  patched text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'set_business_booking_trip_number',
    'notify_business_booking_created',
    'notify_admin_business_booking_created',
    'set_booking_trip_number',
    'notify_new_booking',
    'notify_new_review',
    'log_business_booking_reschedule',
    'notify_booking_datetime_modified'
  ] LOOP
    SELECT pg_get_functiondef(p.oid) INTO def
    FROM pg_proc p WHERE p.proname = fn AND p.pronamespace = 'public'::regnamespace;

    IF def IS NULL THEN
      RAISE EXCEPTION 'restore guard: function % not found', fn;
    END IF;
    IF position('app.restoring_booking' IN def) > 0 THEN
      CONTINUE;
    END IF;

    patched := regexp_replace(
      def,
      E'\nBEGIN\n',
      E'\nBEGIN\n  IF current_setting(''app.restoring_booking'', true) = ''on'' THEN\n    RETURN NEW;\n  END IF;\n\n'
    );
    IF patched = def THEN
      RAISE EXCEPTION 'restore guard: no outer BEGIN found in %', fn;
    END IF;
    EXECUTE patched;
  END LOOP;
END
$guard$;

-- 4. Trash a business trip ---------------------------------------------------------------
-- p_booking_ids must be exactly one trip: a single ungrouped booking, or every journey of
-- one business_booking_groups row. Callers check the business rules (status, refund,
-- vendor) first; this enforces only what keeps the snapshot restorable.
CREATE OR REPLACE FUNCTION public.trash_business_trip(
  p_booking_ids uuid[],
  p_actor_auth_id uuid,
  p_actor_name text,
  p_actor_role text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ids uuid[];
  v_count int;
  v_accounts int;
  v_groups int;
  v_has_ungrouped boolean;
  v_account uuid;
  v_group_id uuid;
  v_group jsonb;
  v_first business_bookings%ROWTYPE;
  v_snapshot jsonb;
  v_trash_id uuid;
BEGIN
  v_ids := ARRAY(SELECT DISTINCT unnest(p_booking_ids));
  IF cardinality(v_ids) = 0 THEN
    RAISE EXCEPTION 'No bookings to delete';
  END IF;

  PERFORM 1 FROM business_bookings WHERE id = ANY(v_ids) FOR UPDATE;

  SELECT count(*),
         count(DISTINCT business_account_id),
         count(DISTINCT booking_group_id),
         bool_or(booking_group_id IS NULL),
         (array_agg(business_account_id))[1],
         (array_agg(booking_group_id) FILTER (WHERE booking_group_id IS NOT NULL))[1]
    INTO v_count, v_accounts, v_groups, v_has_ungrouped, v_account, v_group_id
  FROM business_bookings WHERE id = ANY(v_ids);

  IF v_count <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'Booking not found or already deleted';
  END IF;
  IF v_accounts <> 1
     OR (v_groups = 0 AND v_count <> 1)
     OR (v_groups = 1 AND v_has_ungrouped)
     OR v_groups > 1
     OR (v_groups = 1 AND (SELECT count(*) FROM business_bookings WHERE booking_group_id = v_group_id) <> v_count)
  THEN
    RAISE EXCEPTION 'Delete one whole trip at a time';
  END IF;

  IF v_group_id IS NOT NULL THEN
    SELECT to_jsonb(g) INTO v_group FROM business_booking_groups g WHERE g.id = v_group_id FOR UPDATE;
  END IF;

  SELECT * INTO v_first FROM business_bookings
  WHERE id = ANY(v_ids) ORDER BY COALESCE(leg_index, 0) LIMIT 1;

  v_snapshot := jsonb_build_object(
    'version', 1,
    'group', v_group,
    'bookings', (SELECT jsonb_agg(to_jsonb(b) ORDER BY COALESCE(b.leg_index, 0))
                 FROM business_bookings b WHERE b.id = ANY(v_ids)),
    'addons', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM business_booking_addons a
                        WHERE a.business_booking_id = ANY(v_ids)), '[]'::jsonb),
    'datetime_modifications', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM booking_datetime_modifications m
                                        WHERE m.booking_id = ANY(v_ids)), '[]'::jsonb),
    'quotation_items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', i.id,
               'converted_booking_id', i.converted_booking_id,
               'converted_at', i.converted_at,
               'converted_group_id', i.converted_group_id))
      FROM business_quotation_items i
      WHERE i.converted_booking_id = ANY(v_ids)
         OR (v_group_id IS NOT NULL AND i.converted_group_id = v_group_id)), '[]'::jsonb)
  );

  INSERT INTO deleted_bookings (
    source, business_account_id, trip_type, trip_label, booking_ids, pickup_datetime,
    summary, snapshot, deleted_by, deleted_by_name, deleted_by_role
  ) VALUES (
    'business', v_account, v_first.trip_type,
    COALESCE(v_group->>'group_number', v_first.trip_number, v_first.booking_number),
    v_ids, v_first.pickup_datetime,
    jsonb_strip_nulls(jsonb_build_object(
      'customer_name', v_first.customer_name,
      'booking_number', v_first.booking_number,
      'trip_number', v_first.trip_number,
      'group_number', v_group->>'group_number',
      'leg_count', v_count,
      'booking_status', v_first.booking_status,
      'payment_status', v_first.payment_status,
      'total_price', COALESCE((v_group->>'total_price')::numeric,
                              (SELECT sum(total_price) FROM business_bookings WHERE id = ANY(v_ids))),
      'from_quotation', jsonb_array_length(v_snapshot->'quotation_items') > 0
    )),
    v_snapshot, p_actor_auth_id, p_actor_name, p_actor_role
  ) RETURNING id INTO v_trash_id;

  UPDATE business_quotation_items
     SET converted_booking_id = NULL,
         converted_at = NULL,
         converted_group_id = NULL,
         converted_booking_removed_at = now()
   WHERE converted_booking_id = ANY(v_ids)
      OR (v_group_id IS NOT NULL AND converted_group_id = v_group_id);

  DELETE FROM business_bookings WHERE id = ANY(v_ids);
  IF v_group_id IS NOT NULL THEN
    DELETE FROM business_booking_groups WHERE id = v_group_id;
  END IF;

  DELETE FROM deleted_bookings WHERE expires_at < now();

  RETURN v_trash_id;
END;
$$;

-- 5. Trash a customer trip ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trash_customer_trip(
  p_booking_ids uuid[],
  p_actor_auth_id uuid,
  p_actor_name text,
  p_actor_role text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ids uuid[];
  v_count int;
  v_groups int;
  v_has_ungrouped boolean;
  v_group_id uuid;
  v_group jsonb;
  v_first bookings%ROWTYPE;
  v_snapshot jsonb;
  v_trash_id uuid;
BEGIN
  v_ids := ARRAY(SELECT DISTINCT unnest(p_booking_ids));
  IF cardinality(v_ids) = 0 THEN
    RAISE EXCEPTION 'No bookings to delete';
  END IF;

  PERFORM 1 FROM bookings WHERE id = ANY(v_ids) FOR UPDATE;

  SELECT count(*),
         count(DISTINCT booking_group_id),
         bool_or(booking_group_id IS NULL),
         (array_agg(booking_group_id) FILTER (WHERE booking_group_id IS NOT NULL))[1]
    INTO v_count, v_groups, v_has_ungrouped, v_group_id
  FROM bookings WHERE id = ANY(v_ids);

  IF v_count <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'Booking not found or already deleted';
  END IF;
  IF (v_groups = 0 AND v_count <> 1)
     OR (v_groups = 1 AND v_has_ungrouped)
     OR v_groups > 1
     OR (v_groups = 1 AND (SELECT count(*) FROM bookings WHERE booking_group_id = v_group_id) <> v_count)
  THEN
    RAISE EXCEPTION 'Delete one whole trip at a time';
  END IF;

  IF v_group_id IS NOT NULL THEN
    SELECT to_jsonb(g) INTO v_group FROM booking_groups g WHERE g.id = v_group_id FOR UPDATE;
  END IF;

  SELECT * INTO v_first FROM bookings
  WHERE id = ANY(v_ids) ORDER BY COALESCE(leg_index, 0) LIMIT 1;

  v_snapshot := jsonb_build_object(
    'version', 1,
    'group', v_group,
    'bookings', (SELECT jsonb_agg(to_jsonb(b) ORDER BY COALESCE(b.leg_index, 0))
                 FROM bookings b WHERE b.id = ANY(v_ids)),
    'passengers', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM booking_passengers p
                            WHERE p.booking_id = ANY(v_ids)), '[]'::jsonb),
    'amenities', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM booking_amenities a
                           WHERE a.booking_id = ANY(v_ids)), '[]'::jsonb),
    'reviews', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM reviews r
                         WHERE r.booking_id = ANY(v_ids)), '[]'::jsonb)
  );

  INSERT INTO deleted_bookings (
    source, customer_id, trip_type, trip_label, booking_ids, pickup_datetime,
    summary, snapshot, deleted_by, deleted_by_name, deleted_by_role
  ) VALUES (
    'customer', v_first.customer_id, v_first.trip_type,
    COALESCE(v_group->>'group_number', v_first.trip_number, v_first.booking_number),
    v_ids, v_first.pickup_datetime,
    jsonb_strip_nulls(jsonb_build_object(
      'customer_name', (SELECT COALESCE(full_name, email) FROM profiles WHERE id = v_first.customer_id),
      'booking_number', v_first.booking_number,
      'trip_number', v_first.trip_number,
      'group_number', v_group->>'group_number',
      'leg_count', v_count,
      'booking_status', v_first.booking_status,
      'payment_status', v_first.payment_status,
      'total_price', COALESCE((v_group->>'total_price')::numeric,
                              (SELECT sum(total_price) FROM bookings WHERE id = ANY(v_ids)))
    )),
    v_snapshot, p_actor_auth_id, p_actor_name, p_actor_role
  ) RETURNING id INTO v_trash_id;

  DELETE FROM bookings WHERE id = ANY(v_ids);
  IF v_group_id IS NOT NULL THEN
    DELETE FROM booking_groups WHERE id = v_group_id;
  END IF;

  DELETE FROM deleted_bookings WHERE expires_at < now();

  RETURN v_trash_id;
END;
$$;

-- 6. Restore -------------------------------------------------------------------------------
-- Re-inserts the snapshot with the same ids and numbers. Assignments are not restored: a
-- trip only reaches the trash cancelled or finished, so its assignments were already closed.
-- p_business_account_id scopes a business owner to their own trash; admin passes NULL.
CREATE OR REPLACE FUNCTION public.restore_trashed_trip(
  p_trash_id uuid,
  p_business_account_id uuid DEFAULT NULL,
  p_actor_auth_id uuid DEFAULT NULL,
  p_actor_name text DEFAULT NULL,
  p_actor_role text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t deleted_bookings%ROWTYPE;
  v_group jsonb;
  v_bookings jsonb;
BEGIN
  SELECT * INTO t FROM deleted_bookings WHERE id = p_trash_id FOR UPDATE;
  IF NOT FOUND
     OR (p_business_account_id IS NOT NULL AND t.business_account_id IS DISTINCT FROM p_business_account_id)
  THEN
    RAISE EXCEPTION 'Deleted booking not found' USING ERRCODE = 'P0002';
  END IF;
  IF t.expires_at < now() THEN
    RAISE EXCEPTION 'This deleted booking has expired and can no longer be restored';
  END IF;

  v_group := NULLIF(t.snapshot->'group', 'null'::jsonb);

  PERFORM set_config('app.restoring_booking', 'on', true);

  IF t.source = 'business' THEN
    IF EXISTS (SELECT 1 FROM business_bookings WHERE id = ANY(t.booking_ids)) THEN
      RAISE EXCEPTION 'This booking has already been restored';
    END IF;

    -- A team member who has since been removed: keep the booking, drop the creator link.
    IF v_group IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM business_users WHERE id = (v_group->>'created_by_user_id')::uuid) THEN
        v_group := v_group || '{"created_by_user_id": null}'::jsonb;
      END IF;
      INSERT INTO business_booking_groups
      SELECT * FROM jsonb_populate_record(NULL::business_booking_groups, v_group);
    END IF;

    SELECT jsonb_agg(CASE
             WHEN NOT EXISTS (SELECT 1 FROM business_users u WHERE u.id = (e->>'created_by_user_id')::uuid)
             THEN e || '{"created_by_user_id": null}'::jsonb
             ELSE e END)
      INTO v_bookings
    FROM jsonb_array_elements(t.snapshot->'bookings') e;

    INSERT INTO business_bookings
    SELECT * FROM jsonb_populate_recordset(NULL::business_bookings, v_bookings);

    INSERT INTO business_booking_addons
    SELECT r.* FROM jsonb_populate_recordset(NULL::business_booking_addons,
                                             COALESCE(t.snapshot->'addons', '[]'::jsonb)) r
    WHERE EXISTS (SELECT 1 FROM addons a WHERE a.id = r.addon_id);

    INSERT INTO booking_datetime_modifications
    SELECT r.* FROM jsonb_populate_recordset(NULL::booking_datetime_modifications,
      (SELECT COALESCE(jsonb_agg(CASE
                WHEN NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = (e->>'modified_by_user_id')::uuid)
                THEN e || '{"modified_by_user_id": null}'::jsonb
                ELSE e END), '[]'::jsonb)
       FROM jsonb_array_elements(COALESCE(t.snapshot->'datetime_modifications', '[]'::jsonb)) e)) r;

    UPDATE business_quotation_items i
       SET converted_booking_id = (q->>'converted_booking_id')::uuid,
           converted_at = (q->>'converted_at')::timestamptz,
           converted_group_id = (q->>'converted_group_id')::uuid,
           converted_booking_removed_at = NULL
      FROM jsonb_array_elements(COALESCE(t.snapshot->'quotation_items', '[]'::jsonb)) q
     WHERE i.id = (q->>'id')::uuid
       AND i.converted_booking_id IS NULL;

    BEGIN
      PERFORM log_business_activity(
        p_business_account_id => t.business_account_id,
        p_action              => 'booking.restored',
        p_category            => 'booking',
        p_actor_type          => CASE WHEN p_actor_role = 'admin' THEN 'admin' ELSE 'business_user' END,
        p_actor_name          => COALESCE(p_actor_name, 'Platform admin'),
        p_actor_auth_user_id  => p_actor_auth_id,
        p_actor_role          => p_actor_role,
        p_severity            => 'important',
        p_entity_type         => 'business_booking',
        p_entity_id           => t.booking_ids[1],
        p_entity_label        => t.trip_label,
        p_metadata            => jsonb_build_object('booking_ids', to_jsonb(t.booking_ids),
                                                    'deleted_at', t.deleted_at)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'booking restore activity log failed: %', SQLERRM;
    END;
  ELSE
    IF EXISTS (SELECT 1 FROM bookings WHERE id = ANY(t.booking_ids)) THEN
      RAISE EXCEPTION 'This booking has already been restored';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = t.customer_id) THEN
      RAISE EXCEPTION 'The customer account for this booking no longer exists';
    END IF;

    IF v_group IS NOT NULL THEN
      INSERT INTO booking_groups
      SELECT * FROM jsonb_populate_record(NULL::booking_groups, v_group);
    END IF;

    INSERT INTO bookings
    SELECT * FROM jsonb_populate_recordset(NULL::bookings, t.snapshot->'bookings');

    INSERT INTO booking_passengers
    SELECT * FROM jsonb_populate_recordset(NULL::booking_passengers,
                                           COALESCE(t.snapshot->'passengers', '[]'::jsonb));

    INSERT INTO booking_amenities
    SELECT r.* FROM jsonb_populate_recordset(NULL::booking_amenities,
                                             COALESCE(t.snapshot->'amenities', '[]'::jsonb)) r
    WHERE EXISTS (SELECT 1 FROM addons a WHERE a.id = r.addon_id);

    INSERT INTO reviews
    SELECT r.* FROM jsonb_populate_recordset(NULL::reviews,
      (SELECT COALESCE(jsonb_agg(CASE
                WHEN NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = (e->>'admin_responder_id')::uuid)
                THEN e || '{"admin_responder_id": null}'::jsonb
                ELSE e END), '[]'::jsonb)
       FROM jsonb_array_elements(COALESCE(t.snapshot->'reviews', '[]'::jsonb)) e)) r;
  END IF;

  PERFORM set_config('app.restoring_booking', 'off', true);

  DELETE FROM deleted_bookings WHERE id = p_trash_id;

  RETURN jsonb_build_object(
    'source', t.source,
    'business_account_id', t.business_account_id,
    'booking_ids', to_jsonb(t.booking_ids),
    'trip_label', t.trip_label
  );
END;
$$;

-- 7. Purge -----------------------------------------------------------------------------------
-- No args: expired entries only (called lazily on page load). p_trash_id: that entry too.
-- p_all: empty the whole trash.
CREATE OR REPLACE FUNCTION public.purge_trashed_bookings(
  p_trash_id uuid DEFAULT NULL,
  p_all boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM deleted_bookings
  WHERE expires_at < now()
     OR id = p_trash_id
     OR p_all;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trash_business_trip(uuid[], uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trash_customer_trip(uuid[], uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_trashed_trip(uuid, uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_trashed_bookings(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trash_business_trip(uuid[], uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.trash_customer_trip(uuid[], uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_trashed_trip(uuid, uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_trashed_bookings(uuid, boolean) TO service_role;
