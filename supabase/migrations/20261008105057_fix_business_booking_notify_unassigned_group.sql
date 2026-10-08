-- Fix for business_trip_types: both create-notification triggers read v_group.<field>
-- from a RECORD that is only assigned for round-trip / multi-city rows. For one-way and
-- hourly rows PL/pgSQL raised "record v_group is not assigned yet": the admin trigger
-- failed the INSERT, and the business trigger swallowed it and sent nothing. Plain
-- scalar variables are NULL until assigned, which is what jsonb_build_object needs.

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
  v_group_number TEXT;
  v_group_trip_type TEXT;
  v_group_leg_count INTEGER;
  v_group_total NUMERIC;
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
      SELECT group_number, trip_type, leg_count, total_price
        INTO v_group_number, v_group_trip_type, v_group_leg_count, v_group_total
      FROM business_booking_groups WHERE id = NEW.booking_group_id;
    END IF;

    IF v_group_number IS NOT NULL THEN
      v_title := 'New Booking - #' || v_group_number;
      v_message := CASE v_group_trip_type WHEN 'round_trip' THEN 'Round trip' ELSE 'Multi-city trip' END
                   || ' #' || v_group_number || ' (' || v_group_leg_count || ' journeys) for '
                   || COALESCE(NEW.customer_name, 'your customer') || ' has been created';
    ELSE
      v_title := 'New Booking - #' || v_booking_ref;
      v_message := CASE WHEN NEW.trip_type = 'hourly' THEN 'Hourly booking #' ELSE 'Booking #' END
                   || v_booking_ref || ' for ' || COALESCE(NEW.customer_name, 'your customer')
                   || ' has been created';
    END IF;

    v_link := '/business/bookings/' || NEW.id;
    v_data := jsonb_strip_nulls(jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'trip_type', NEW.trip_type,
      'group_number', v_group_number,
      'business_account_id', NEW.business_account_id,
      'customer_name', NEW.customer_name,
      'total_price', COALESCE(v_group_total, NEW.total_price)
    ));

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
  v_group_number TEXT;
  v_group_trip_type TEXT;
  v_group_leg_count INTEGER;
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
    SELECT group_number, trip_type, leg_count
      INTO v_group_number, v_group_trip_type, v_group_leg_count
    FROM business_booking_groups WHERE id = NEW.booking_group_id;
  END IF;

  IF v_group_number IS NOT NULL THEN
    v_ref := v_group_number || ' (' || v_group_leg_count || ' journeys)';
    v_kind := CASE v_group_trip_type WHEN 'round_trip' THEN 'Business round trip #'
                                     ELSE 'Business multi-city trip #' END;
  ELSIF NEW.trip_type = 'hourly' THEN
    v_kind := 'Business hourly booking #';
  END IF;

  PERFORM create_admin_notification(
    'booking'::notification_category,
    'business_booking_created',
    'New Business Booking',
    v_kind || v_ref || ' created by ' || business_name_display || ' for ' || customer_name_display,
    jsonb_strip_nulls(jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'trip_type', NEW.trip_type,
      'group_number', v_group_number,
      'business_account_id', NEW.business_account_id,
      'business_name', business_name_display,
      'customer_name', customer_name_display
    )),
    '/admin/bookings/' || NEW.id
  );

  RETURN NEW;
END;
$function$;
