-- The two customer booking notices never fired: `OLD IS NOT NULL` on a row is
-- true only when every column of OLD is non-null, which a bookings row never is.
-- TG_OP says what was meant. Also:
--   * a cancellation now gives one notice (the cancelled trigger), not two;
--   * the link points at the account page that exists (/account/bookings/<ref>);
--   * guests are still skipped by create_customer_notification, and the unpaid-
--     expiry job is still skipped through app.expiring_unpaid.

CREATE OR REPLACE FUNCTION public.notify_customer_booking_cancelled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.expiring_unpaid', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.booking_status = 'cancelled'
     AND OLD.booking_status IS DISTINCT FROM 'cancelled' THEN
    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_cancelled',
      'Booking Cancelled',
      'Your booking #' || COALESCE(NEW.trip_number, NEW.booking_number, NEW.id::TEXT) || ' has been cancelled',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'trip_number', NEW.trip_number,
        'cancelled_at', NOW()
      ),
      '/account/bookings/' || NEW.booking_number
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_customer_booking_status_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  status_label TEXT;
BEGIN
  IF current_setting('app.expiring_unpaid', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- A round trip or multi-city trip is announced once, by its first journey.
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0
     AND NEW.booking_status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Cancellation has its own notice (notify_customer_booking_cancelled).
  IF TG_OP = 'UPDATE' AND NEW.booking_status IS DISTINCT FROM OLD.booking_status
     AND NEW.booking_status <> 'cancelled' THEN
    status_label := CASE NEW.booking_status
      WHEN 'pending' THEN 'Pending'
      WHEN 'confirmed' THEN 'Confirmed'
      WHEN 'completed' THEN 'Completed'
      WHEN 'refunded' THEN 'Refunded'
      ELSE NEW.booking_status
    END;

    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_status_changed',
      'Booking Status Updated',
      'Your booking #' || COALESCE(NEW.trip_number, NEW.booking_number, NEW.id::TEXT) || ' is now ' || status_label,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'trip_number', NEW.trip_number,
        'old_status', OLD.booking_status,
        'new_status', NEW.booking_status
      ),
      '/account/bookings/' || NEW.booking_number
    );
  END IF;
  RETURN NEW;
END;
$function$;
