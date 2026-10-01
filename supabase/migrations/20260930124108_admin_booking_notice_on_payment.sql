-- Notify admins of a customer booking when it is paid, not when checkout starts.
-- Business bookings already work this way: their notice fires after the wallet is
-- charged. Firing on insert announced abandoned checkouts and left notices
-- pointing at rolled-back bookings. The message now names hourly, round trip and
-- multi-city trips. Type, title, category and link are unchanged, so the admin
-- bell, toast and filters keep working.

CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_name_display TEXT;
  group_number_display TEXT;
  group_leg_count INT;
  reference_display TEXT;
  message_display TEXT;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.payment_status IS NOT DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  -- A round trip or multi-city trip is announced once, by its first journey.
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email, 'Guest')
  INTO customer_name_display
  FROM profiles
  WHERE id = NEW.customer_id;

  IF customer_name_display IS NULL THEN
    customer_name_display := 'Guest';
  END IF;

  reference_display := COALESCE(NEW.trip_number, NEW.booking_number);

  IF NEW.booking_group_id IS NOT NULL THEN
    SELECT group_number, leg_count
    INTO group_number_display, group_leg_count
    FROM booking_groups
    WHERE id = NEW.booking_group_id;

    message_display :=
      CASE WHEN NEW.trip_type = 'multi_city' THEN 'Multi-city trip #' ELSE 'Round trip #' END
      || COALESCE(group_number_display, reference_display)
      || ' (' || COALESCE(group_leg_count, 2) || ' journeys) from ' || customer_name_display;
  ELSIF NEW.trip_type = 'hourly' THEN
    message_display := 'Hourly booking #' || reference_display || ' from ' || customer_name_display;
  ELSE
    message_display := 'Booking #' || reference_display || ' from ' || customer_name_display;
  END IF;

  PERFORM create_admin_notification(
    'booking'::notification_category,
    'booking_created',
    'New Booking Received',
    message_display,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'customer_id', NEW.customer_id,
      'booking_group_id', NEW.booking_group_id,
      'group_number', group_number_display,
      'trip_type', NEW.trip_type
    ),
    '/admin/bookings/' || NEW.id
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;

CREATE TRIGGER trigger_notify_new_booking
AFTER INSERT OR UPDATE OF payment_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();
