-- Two notification triggers read a NEW.<field> that does not exist on their
-- table. PL/pgSQL only compiles an expression when the line is first reached,
-- so neither failed at CREATE time - they fail at runtime, on the statement
-- that fires them, and take the whole INSERT/UPDATE down with them.
--
--   notify_new_review    -> NEW.user_id       (reviews has customer_id)
--   notify_payment_failed-> NEW.customer_name (bookings has no such column)
--
-- Reproduced against the live database:
--   INSERT INTO reviews ...                     -> 42703 record "new" has no field "user_id"
--   UPDATE bookings SET payment_status='failed' -> 42703 record "new" has no field "customer_name"
--
-- Only the offending expressions change. Trigger bindings, SECURITY DEFINER,
-- search_path, notification category/type and message wording are all left
-- exactly as they were, so nothing downstream shifts.

-- ---------------------------------------------------------------------------
-- notify_new_review: reviews.customer_id is the reviewer.
--
-- The payload key is renamed user_id -> customer_id to match notify_new_booking.
-- Safe: nothing in the app reads the notifications.data payload - only the type
-- string, mapped to a label in lib/notifications/types.ts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name TEXT;
BEGIN
  customer_name := (
    SELECT COALESCE(full_name, email, 'A customer')
    FROM profiles
    WHERE id = NEW.customer_id
    LIMIT 1
  );

  -- The reviewer's profile can be gone (customer_id is NOT NULL, but a stale
  -- row or a service-role insert can still miss the lookup), so never let a
  -- NULL name concatenate the whole message away.
  IF customer_name IS NULL THEN
    customer_name := 'A customer';
  END IF;

  PERFORM create_admin_notification(
    'review'::notification_category,
    'review_submitted',
    'New Review Submitted',
    customer_name || ' submitted a ' || NEW.rating || '-star review',
    jsonb_build_object(
      'review_id', NEW.id,
      'customer_id', NEW.customer_id,
      'rating', NEW.rating
    ),
    '/admin/reviews'
  );
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- notify_payment_failed: bookings carries no customer name of its own. Fall
-- back to the profile, then the primary passenger (where the name actually
-- lives for this booking), then a generic label.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_payment_failed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name TEXT;
  booking_num TEXT;
  trip_num TEXT;
BEGIN
  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    customer_name := COALESCE(
      (SELECT full_name FROM profiles WHERE id = NEW.customer_id LIMIT 1),
      (SELECT btrim(first_name || ' ' || last_name)
         FROM booking_passengers
        WHERE booking_id = NEW.id AND is_primary IS TRUE
        ORDER BY created_at
        LIMIT 1),
      'Customer'
    );

    booking_num := NEW.booking_number;
    trip_num    := NEW.trip_number;

    PERFORM create_admin_notification(
      'payment'::notification_category,
      'payment_failed',
      'Payment Failed',
      'Payment failed for booking #' || COALESCE(trip_num, booking_num) || ' (' || customer_name || ')',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'trip_number', trip_num,
        'customer_id', NEW.customer_id
      ),
      '/admin/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;
