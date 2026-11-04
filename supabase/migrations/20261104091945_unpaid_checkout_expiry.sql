-- Expire customer checkouts that were never paid.
--
-- Checkout saves the booking (pending / processing) before the card page, so an
-- abandoned checkout used to stay open forever. This adds:
--   * payment_expired_at on bookings and booking_groups: the marker that tells
--     "expired unpaid" apart from a customer or admin cancel. payment_status is
--     left as 'processing'.
--   * booking_automation_settings: admin-controlled on/off + minutes. Its own
--     table because the General settings form rewrites site_settings.config.
--   * expire_unpaid_bookings(): the job. Customer tables only; rows with an
--     active vendor assignment, paid rows and payment_status 'pending' rows are
--     never touched. Business tables are not referenced.

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_expired_at timestamptz;
ALTER TABLE public.booking_groups ADD COLUMN IF NOT EXISTS payment_expired_at timestamptz;

-- The job's scan: unpaid checkouts by age. Partial, so it stays tiny.
CREATE INDEX IF NOT EXISTS bookings_unpaid_checkout_idx
  ON public.bookings (created_at)
  WHERE booking_status = 'pending' AND payment_status = 'processing';
CREATE INDEX IF NOT EXISTS booking_groups_unpaid_checkout_idx
  ON public.booking_groups (created_at)
  WHERE booking_status = 'pending' AND payment_status = 'processing';

CREATE TABLE public.booking_automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expire_unpaid_enabled boolean NOT NULL DEFAULT true,
  expire_unpaid_minutes integer NOT NULL DEFAULT 60
    CHECK (expire_unpaid_minutes BETWEEN 15 AND 1440),
  last_run_at timestamptz,
  last_run_expired integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX booking_automation_settings_updated_by_idx
  ON public.booking_automation_settings (updated_by);

CREATE TRIGGER booking_automation_settings_updated_at
  BEFORE UPDATE ON public.booking_automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booking_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read booking automation settings"
  ON public.booking_automation_settings FOR SELECT
  USING (public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can update booking automation settings"
  ON public.booking_automation_settings FOR UPDATE
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

INSERT INTO public.booking_automation_settings DEFAULT VALUES;

CREATE OR REPLACE FUNCTION public.expire_unpaid_bookings(p_force boolean DEFAULT false)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_settings public.booking_automation_settings%ROWTYPE;
  v_cutoff timestamptz;
  v_now timestamptz := now();
  v_groups integer := 0;
  v_singles integer := 0;
  v_reason constant text := 'Payment not completed in time';
BEGIN
  SELECT * INTO v_settings FROM public.booking_automation_settings LIMIT 1;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF NOT v_settings.expire_unpaid_enabled AND NOT p_force THEN
    RETURN 0;
  END IF;

  v_cutoff := v_now - make_interval(mins => v_settings.expire_unpaid_minutes);

  -- Read by the customer notification triggers: an abandoned checkout is not a
  -- cancellation the customer should hear about. Transaction-local.
  PERFORM set_config('app.expiring_unpaid', 'on', true);

  -- Round trips and multi-city trips expire as one, group first, then its journeys.
  WITH expired AS (
    UPDATE public.booking_groups g
       SET booking_status = 'cancelled',
           payment_expired_at = v_now
     WHERE g.booking_status = 'pending'
       AND g.payment_status = 'processing'
       AND g.created_at < v_cutoff
       AND NOT EXISTS (
         SELECT 1
           FROM public.bookings b
           JOIN public.booking_assignments a ON a.booking_id = b.id
          WHERE b.booking_group_id = g.id
            AND a.status IN ('pending', 'accepted')
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.bookings b
          WHERE b.booking_group_id = g.id
            AND b.payment_status = 'completed'
       )
    RETURNING g.id
  ), legs AS (
    UPDATE public.bookings b
       SET booking_status = 'cancelled',
           cancelled_at = v_now,
           cancellation_reason = v_reason,
           payment_expired_at = v_now,
           updated_at = v_now
      FROM expired e
     WHERE b.booking_group_id = e.id
       AND b.booking_status = 'pending'
       AND b.payment_status = 'processing'
    RETURNING b.id
  )
  SELECT count(*) INTO v_groups FROM expired;

  WITH expired AS (
    UPDATE public.bookings b
       SET booking_status = 'cancelled',
           cancelled_at = v_now,
           cancellation_reason = v_reason,
           payment_expired_at = v_now,
           updated_at = v_now
     WHERE b.booking_group_id IS NULL
       AND b.booking_status = 'pending'
       AND b.payment_status = 'processing'
       AND b.created_at < v_cutoff
       AND NOT EXISTS (
         SELECT 1 FROM public.booking_assignments a
          WHERE a.booking_id = b.id
            AND a.status IN ('pending', 'accepted')
       )
    RETURNING b.id
  )
  SELECT count(*) INTO v_singles FROM expired;

  PERFORM set_config('app.expiring_unpaid', 'off', true);

  UPDATE public.booking_automation_settings
     SET last_run_at = v_now,
         last_run_expired = v_groups + v_singles
   WHERE id = v_settings.id;

  RETURN v_groups + v_singles;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_unpaid_bookings(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_unpaid_bookings(boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_bookings(boolean) TO service_role;

-- Customer notification triggers: skip while the expiry job runs. Bodies are
-- otherwise unchanged.
CREATE OR REPLACE FUNCTION public.notify_customer_booking_cancelled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_num TEXT;
  trip_num TEXT;
BEGIN
  IF current_setting('app.expiring_unpaid', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF OLD IS NOT NULL AND NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
    SELECT booking_number, trip_number INTO booking_num, trip_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_cancelled',
      'Booking Cancelled',
      'Your booking #' || COALESCE(trip_num, booking_num, NEW.id::TEXT) || ' has been cancelled',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'trip_number', trip_num,
        'cancelled_at', NOW()
      ),
      '/customer/bookings/' || NEW.id
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
  booking_num TEXT;
  trip_num TEXT;
  status_label TEXT;
BEGIN
  IF current_setting('app.expiring_unpaid', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0
     AND NEW.booking_status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF OLD IS NOT NULL AND NEW.booking_status != OLD.booking_status THEN
    SELECT booking_number, trip_number INTO booking_num, trip_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

    status_label := CASE NEW.booking_status
      WHEN 'pending' THEN 'Pending Assignment'
      WHEN 'assigned' THEN 'Assigned to Vendor'
      WHEN 'confirmed' THEN 'Confirmed'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'completed' THEN 'Completed'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.booking_status
    END;

    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_status_changed',
      'Booking Status Updated',
      'Your booking #' || COALESCE(trip_num, booking_num, NEW.id::TEXT) || ' is now ' || status_label,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'trip_number', trip_num,
        'old_status', OLD.booking_status,
        'new_status', NEW.booking_status
      ),
      '/customer/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

