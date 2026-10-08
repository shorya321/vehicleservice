-- Business trip types: round trip, multi-city, hourly for business_bookings.
-- Business twin of 20260921092503_trip_types_foundation (customer side).
-- Round trip / multi-city = N business_bookings rows (one per journey) tied by
-- business_booking_groups, paid with ONE wallet deduction. Hourly = one row.
-- Column names match public.bookings on purpose: admin and vendor screens read
-- trip_type / booking_group_id / leg_index / hourly_* and a booking_group embed.
-- One-way rows and create_booking_with_wallet_deduction are untouched.

CREATE SEQUENCE IF NOT EXISTS public.business_booking_group_number_seq;

CREATE TABLE public.business_booking_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number text NOT NULL UNIQUE,
  business_account_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  created_by_user_id uuid REFERENCES public.business_users(id) ON DELETE SET NULL,
  trip_type text NOT NULL CHECK (trip_type IN ('round_trip','multi_city')),
  leg_count smallint NOT NULL CHECK (leg_count BETWEEN 2 AND 6),
  vehicle_type_id uuid NOT NULL REFERENCES public.vehicle_types(id),
  currency text NOT NULL DEFAULT 'AED',
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 50),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_price numeric(10,2) NOT NULL CHECK (total_price > 0),
  booking_status text NOT NULL DEFAULT 'confirmed'
    CHECK (booking_status IN ('confirmed','completed','cancelled','refunded')),
  payment_status text NOT NULL DEFAULT 'completed'
    CHECK (payment_status IN ('completed','refunded')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  price_signature text,
  price_signature_timestamp bigint,
  price_signature_nonce text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_booking_groups_account_idx
  ON public.business_booking_groups (business_account_id);

ALTER TABLE public.business_booking_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business users view own booking groups" ON public.business_booking_groups
  FOR SELECT USING (business_account_id IN (
    SELECT business_users.business_account_id FROM public.business_users
    WHERE business_users.auth_user_id = (select auth.uid())));
CREATE POLICY "Admins view all business booking groups" ON public.business_booking_groups
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role));
CREATE POLICY "Service role manages business booking groups" ON public.business_booking_groups
  FOR ALL USING ((select auth.role()) = 'service_role');

CREATE TRIGGER business_booking_groups_set_updated_at
  BEFORE UPDATE ON public.business_booking_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_business_booking_group_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.group_number IS NULL OR NEW.group_number = '' THEN
    NEW.group_number := 'BG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                        LPAD(NEXTVAL('business_booking_group_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_business_booking_group_number_trigger
  BEFORE INSERT ON public.business_booking_groups
  FOR EACH ROW EXECUTE FUNCTION public.generate_business_booking_group_number();

ALTER TABLE public.business_bookings
  ADD COLUMN trip_type text NOT NULL DEFAULT 'one_way'
    CHECK (trip_type IN ('one_way','round_trip','multi_city','hourly')),
  ADD COLUMN booking_group_id uuid REFERENCES public.business_booking_groups(id) ON DELETE CASCADE,
  ADD COLUMN leg_index smallint CHECK (leg_index >= 0),
  ADD COLUMN hourly_package text CHECK (hourly_package IN ('half_day','full_day')),
  ADD COLUMN duration_hours numeric(4,1) CHECK (duration_hours > 0 AND duration_hours <= 24),
  ADD COLUMN included_km integer CHECK (included_km >= 0),
  ADD COLUMN extra_hour_price numeric(10,2) CHECK (extra_hour_price >= 0),
  ADD COLUMN discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN refund_due numeric(10,2) CHECK (refund_due >= 0);

ALTER TABLE public.business_bookings
  ADD CONSTRAINT business_bookings_hourly_has_duration
    CHECK (trip_type <> 'hourly' OR (duration_hours IS NOT NULL AND hourly_package IS NOT NULL)),
  ADD CONSTRAINT business_bookings_grouped_trip_has_group
    CHECK (trip_type NOT IN ('round_trip','multi_city') OR (booking_group_id IS NOT NULL AND leg_index IS NOT NULL)),
  ADD CONSTRAINT business_bookings_group_leg_unique UNIQUE (booking_group_id, leg_index);

CREATE INDEX business_bookings_booking_group_id_idx ON public.business_bookings (booking_group_id)
  WHERE booking_group_id IS NOT NULL;

-- Trip number: hourly gets the H service code (row seeded by the customer migration).
CREATE OR REPLACE FUNCTION public.set_business_booking_trip_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_from_type_id UUID;
  v_to_type_id UUID;
  v_service_code TEXT;
BEGIN
  IF NEW.trip_type = 'hourly' THEN
    v_service_code := 'H';
  ELSIF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT location_type_id INTO v_from_type_id FROM locations WHERE id = NEW.from_location_id;
    SELECT location_type_id INTO v_to_type_id FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type_id, v_to_type_id);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$function$;

-- Business bell: one per trip. Journeys after the first are skipped; the first
-- journey's notification names the whole trip.
CREATE OR REPLACE FUNCTION public.notify_business_booking_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_auth_id UUID;
  v_owner_auth_id UUID;
  v_booking_ref TEXT;
  v_title TEXT;
  v_message TEXT;
  v_data JSONB;
  v_link TEXT;
  v_group RECORD;
BEGIN
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0 THEN
    RETURN NEW;
  END IF;

  -- Best effort. The wallet has already been debited by the time this runs, so a failure here must
  -- never roll back a paid booking. Mirrors how create_booking_with_wallet_deduction guards its
  -- log_business_activity call.
  BEGIN
    v_booking_ref := COALESCE(NEW.trip_number, NEW.booking_number);

    IF NEW.created_by_user_id IS NOT NULL THEN
      SELECT auth_user_id INTO v_creator_auth_id
      FROM business_users
      WHERE id = NEW.created_by_user_id;
    END IF;

    -- LIMIT 1 rather than the .single() the API routes use: an account that somehow holds two owner
    -- rows makes those routes drop the notification silently, which is worse than picking one.
    SELECT auth_user_id INTO v_owner_auth_id
    FROM business_users
    WHERE business_account_id = NEW.business_account_id
      AND role = 'owner'
      AND auth_user_id IS NOT NULL
    ORDER BY created_at
    LIMIT 1;

    IF NEW.booking_group_id IS NOT NULL THEN
      SELECT group_number, trip_type, leg_count, total_price INTO v_group
      FROM business_booking_groups WHERE id = NEW.booking_group_id;
      v_title := 'New Booking - #' || v_group.group_number;
      v_message := CASE v_group.trip_type WHEN 'round_trip' THEN 'Round trip' ELSE 'Multi-city trip' END
                   || ' #' || v_group.group_number || ' (' || v_group.leg_count || ' journeys) for '
                   || COALESCE(NEW.customer_name, 'your customer') || ' has been created';
    ELSE
      v_title := 'New Booking - #' || v_booking_ref;
      v_message := CASE WHEN NEW.trip_type = 'hourly' THEN 'Hourly booking #' ELSE 'Booking #' END
                   || v_booking_ref || ' for ' || COALESCE(NEW.customer_name, 'your customer')
                   || ' has been created';
    END IF;

    v_link := '/business/bookings/' || NEW.id;
    v_data := jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'trip_type', NEW.trip_type,
      'group_number', v_group.group_number,
      'business_account_id', NEW.business_account_id,
      'customer_name', NEW.customer_name,
      'total_price', COALESCE(v_group.total_price, NEW.total_price)
    );

    IF v_creator_auth_id IS NOT NULL THEN
      PERFORM create_business_notification(
        v_creator_auth_id,
        'booking'::notification_category,
        'booking_created',
        v_title,
        v_message,
        v_data,
        v_link
      );
    END IF;

    IF v_owner_auth_id IS NOT NULL AND v_owner_auth_id IS DISTINCT FROM v_creator_auth_id THEN
      PERFORM create_business_notification(
        v_owner_auth_id,
        'booking'::notification_category,
        'booking_created',
        v_title,
        v_message,
        v_data,
        v_link
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_business_booking_created failed for booking %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Admin bell: one per trip, same rule.
CREATE OR REPLACE FUNCTION public.notify_admin_business_booking_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  business_name_display TEXT;
  customer_name_display TEXT;
  v_ref TEXT;
  v_kind TEXT;
  v_group RECORD;
BEGIN
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0 THEN
    RETURN NEW;
  END IF;

  SELECT business_name INTO business_name_display
  FROM business_accounts
  WHERE id = NEW.business_account_id;

  customer_name_display := NEW.customer_name;
  v_ref := COALESCE(NEW.trip_number, NEW.booking_number);
  v_kind := 'Business booking #';

  IF NEW.booking_group_id IS NOT NULL THEN
    SELECT group_number, trip_type, leg_count INTO v_group
    FROM business_booking_groups WHERE id = NEW.booking_group_id;
    v_ref := v_group.group_number || ' (' || v_group.leg_count || ' journeys)';
    v_kind := CASE v_group.trip_type WHEN 'round_trip' THEN 'Business round trip #'
                                     ELSE 'Business multi-city trip #' END;
  ELSIF NEW.trip_type = 'hourly' THEN
    v_kind := 'Business hourly booking #';
  END IF;

  PERFORM create_admin_notification(
    'booking'::notification_category,
    'business_booking_created',
    'New Business Booking',
    v_kind || v_ref || ' created by ' || business_name_display || ' for ' || customer_name_display,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'trip_type', NEW.trip_type,
      'group_number', v_group.group_number,
      'business_account_id', NEW.business_account_id,
      'business_name', business_name_display,
      'customer_name', customer_name_display
    ),
    '/admin/bookings/' || NEW.id
  );

  RETURN NEW;
END;
$function$;

-- One wallet deduction for a whole trip. Hourly: p_legs holds one element and no
-- group is created. Round trip / multi-city: a group row plus one row per leg.
-- Each leg's total_price / wallet_deduction_amount is its share of the charge, so
-- revenue sums stay right and cancel_business_booking_with_refund caps a journey
-- refund at that journey's share.
CREATE OR REPLACE FUNCTION public.create_business_trip_with_wallet_deduction(
  p_business_id uuid,
  p_created_by_user_id uuid,
  p_trip_type text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_vehicle_type_id uuid,
  p_passenger_count integer,
  p_adults integer,
  p_children integer,
  p_infants integer,
  p_subtotal numeric,
  p_discount_percent numeric,
  p_discount_amount numeric,
  p_total_price numeric,
  p_legs jsonb,
  p_customer_notes text DEFAULT NULL::text,
  p_reference_number text DEFAULT NULL::text,
  p_hourly_package text DEFAULT NULL::text,
  p_duration_hours numeric DEFAULT NULL::numeric,
  p_included_km integer DEFAULT NULL::integer,
  p_extra_hour_price numeric DEFAULT NULL::numeric,
  p_price_signature text DEFAULT NULL::text,
  p_price_signature_timestamp bigint DEFAULT NULL::bigint,
  p_price_signature_nonce text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_leg jsonb;
  v_leg_count integer;
  v_index integer := 0;
  v_group_id uuid;
  v_group_number text;
  v_booking_id uuid;
  v_booking_ids uuid[] := ARRAY[]::uuid[];
  v_first_booking_number text;
  v_first_pickup timestamptz;
  v_leg_sum numeric := 0;
  v_deduct_result json;
  v_new_balance numeric;
  v_transaction_id uuid;
  v_ref_label text;
BEGIN
  IF p_trip_type NOT IN ('round_trip','multi_city','hourly') THEN
    RAISE EXCEPTION 'Invalid trip type: %', p_trip_type;
  END IF;

  v_leg_count := jsonb_array_length(p_legs);

  IF p_trip_type = 'hourly' AND v_leg_count <> 1 THEN
    RAISE EXCEPTION 'An hourly booking has exactly one journey';
  END IF;
  IF p_trip_type = 'round_trip' AND v_leg_count <> 2 THEN
    RAISE EXCEPTION 'A round trip has exactly two journeys';
  END IF;
  IF p_trip_type = 'multi_city' AND (v_leg_count < 2 OR v_leg_count > 6) THEN
    RAISE EXCEPTION 'A multi-city trip has 2 to 6 journeys';
  END IF;

  FOR v_leg IN SELECT * FROM jsonb_array_elements(p_legs) LOOP
    IF (v_leg->>'total_price')::numeric <= 0 THEN
      RAISE EXCEPTION 'Every journey must have a positive price';
    END IF;
    v_leg_sum := v_leg_sum + (v_leg->>'total_price')::numeric;
  END LOOP;

  IF round(v_leg_sum, 2) <> round(p_total_price, 2) THEN
    RAISE EXCEPTION 'Journey prices do not add up to the trip total';
  END IF;

  v_deduct_result := deduct_from_wallet(
    p_business_id,
    p_total_price,
    'Trip creation (pending booking ID)',
    NULL::UUID,
    'AED'
  );
  v_new_balance := (v_deduct_result->>'new_balance')::numeric;
  v_transaction_id := (v_deduct_result->>'transaction_id')::uuid;

  IF p_trip_type <> 'hourly' THEN
    INSERT INTO business_booking_groups (
      business_account_id, created_by_user_id, trip_type, leg_count, vehicle_type_id,
      subtotal, discount_percent, discount_amount, total_price,
      price_signature, price_signature_timestamp, price_signature_nonce
    ) VALUES (
      p_business_id, p_created_by_user_id, p_trip_type, v_leg_count, p_vehicle_type_id,
      p_subtotal, p_discount_percent, p_discount_amount, p_total_price,
      p_price_signature, p_price_signature_timestamp, p_price_signature_nonce
    ) RETURNING id, group_number INTO v_group_id, v_group_number;
  END IF;

  FOR v_leg IN SELECT * FROM jsonb_array_elements(p_legs) LOOP
    INSERT INTO business_bookings (
      business_account_id, created_by_user_id,
      customer_name, customer_email, customer_phone,
      from_location_id, to_location_id,
      pickup_address, dropoff_address, pickup_datetime,
      vehicle_type_id, passenger_count,
      adults, children, infants,
      base_price, total_price, wallet_deduction_amount, discount_amount,
      customer_notes, reference_number,
      booking_status, payment_status,
      trip_type, booking_group_id, leg_index,
      hourly_package, duration_hours, included_km, extra_hour_price,
      price_signature, price_signature_timestamp, price_signature_nonce
    ) VALUES (
      p_business_id, p_created_by_user_id,
      p_customer_name, p_customer_email, p_customer_phone,
      (v_leg->>'from_location_id')::uuid, NULLIF(v_leg->>'to_location_id', '')::uuid,
      v_leg->>'pickup_address', v_leg->>'dropoff_address', (v_leg->>'pickup_datetime')::timestamptz,
      p_vehicle_type_id, p_passenger_count,
      p_adults, p_children, p_infants,
      (v_leg->>'base_price')::numeric, (v_leg->>'total_price')::numeric,
      (v_leg->>'total_price')::numeric, COALESCE((v_leg->>'discount_amount')::numeric, 0),
      p_customer_notes, p_reference_number,
      'confirmed', 'completed',
      p_trip_type, v_group_id, CASE WHEN v_group_id IS NULL THEN NULL ELSE v_index END,
      p_hourly_package, p_duration_hours, p_included_km, p_extra_hour_price,
      CASE WHEN v_group_id IS NULL THEN p_price_signature END,
      CASE WHEN v_group_id IS NULL THEN p_price_signature_timestamp END,
      CASE WHEN v_group_id IS NULL THEN p_price_signature_nonce END
    ) RETURNING id INTO v_booking_id;

    IF v_index = 0 THEN
      SELECT booking_number INTO v_first_booking_number FROM business_bookings WHERE id = v_booking_id;
      v_first_pickup := (v_leg->>'pickup_datetime')::timestamptz;
    END IF;

    v_booking_ids := v_booking_ids || v_booking_id;
    v_index := v_index + 1;
  END LOOP;

  v_ref_label := COALESCE(v_group_number, v_first_booking_number);

  UPDATE wallet_transactions
  SET
    reference_id = v_booking_ids[1],
    description = CASE WHEN v_group_id IS NULL THEN 'Booking deduction for '
                       ELSE 'Trip deduction for ' END || v_ref_label
  WHERE id = v_transaction_id;

  BEGIN
    PERFORM log_business_activity(
      p_business_account_id    => p_business_id,
      p_action                 => 'booking.created',
      p_category               => 'booking',
      p_actor_type             => 'business_user',
      p_actor_business_user_id => p_created_by_user_id,
      p_severity               => 'important',
      p_entity_type            => 'business_booking',
      p_entity_id              => v_booking_ids[1],
      p_entity_label           => v_ref_label,
      p_amount                 => p_total_price,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'pickup_at', v_first_pickup,
        'pickup_clause', ' for ' || to_char(v_first_pickup, 'DD Mon YYYY at HH24:MI'),
        'passenger_count', p_passenger_count,
        'balance_after', v_new_balance,
        'wallet_transaction_id', v_transaction_id,
        'reference_number', p_reference_number,
        'trip_type', p_trip_type,
        'group_number', v_group_number,
        'leg_count', v_leg_count
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'create_business_trip activity log failed: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'group_id', v_group_id,
    'group_number', v_group_number,
    'booking_ids', to_jsonb(v_booking_ids)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_business_trip_with_wallet_deduction(
  uuid, uuid, text, text, text, text, uuid, integer, integer, integer, integer,
  numeric, numeric, numeric, numeric, jsonb, text, text, text, numeric, integer, numeric,
  text, bigint, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_trip_with_wallet_deduction(
  uuid, uuid, text, text, text, text, uuid, integer, integer, integer, integer,
  numeric, numeric, numeric, numeric, jsonb, text, text, text, numeric, integer, numeric,
  text, bigint, text)
  TO service_role;
