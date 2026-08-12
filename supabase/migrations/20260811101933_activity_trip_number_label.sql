-- Business activity feed: label booking rows with the trip number.
--
-- Every other surface in the portal leads with business_bookings.trip_number
-- (bookings table, booking card, dashboard, booking detail, vendor and customer
-- screens). The activity feed was the only place still showing the internal
-- booking_number, so an owner cross-referencing a trip against the feed saw two
-- different identifiers for the same journey.
--
-- Why a trigger on the log table rather than edits to the eleven writers:
-- business_booking rows are produced by four capture triggers, three money
-- functions, two one-off backfill inserts and two TypeScript routes. Editing
-- them all is large, and two of them (create_booking_with_wallet_deduction and
-- log_business_booking_reschedule) have live bodies that were patched in place
-- by 20260811093500 via pg_get_functiondef + replace. Re-issuing those from the
-- 20260805 source text would silently revert the operating-timezone fix. One
-- BEFORE INSERT trigger normalises the label for all of them, present and
-- future, and touches none of those bodies.
--
-- The booking number is not discarded. It moves into metadata.booking_number,
-- which keeps it in the detail panel, in the CSV export and searchable, and
-- makes the whole change reversible.

CREATE OR REPLACE FUNCTION public.business_activity_use_trip_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trip    text;
  v_booking text;
BEGIN
  IF NEW.entity_type IS DISTINCT FROM 'business_booking' OR NEW.entity_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT bb.trip_number, bb.booking_number
  INTO   v_trip, v_booking
  FROM   business_bookings bb
  WHERE  bb.id = NEW.entity_id;

  -- No booking to read: the AFTER DELETE path logs once the row is already
  -- gone, so it carries its own trip number and there is nothing to do here.
  IF v_trip IS NULL OR NEW.entity_label IS NOT DISTINCT FROM v_trip THEN
    RETURN NEW;
  END IF;

  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb)
    || jsonb_build_object('booking_number', COALESCE(NEW.entity_label, v_booking));
  NEW.entity_label := v_trip;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- This runs inside create_booking_with_wallet_deduction and
  -- cancel_business_booking_with_refund. An exception raised here would roll
  -- back the booking and its wallet movement along with it. Relabelling is
  -- cosmetic and must never be able to do that, so any failure degrades to the
  -- booking number the writer supplied.
  RAISE WARNING 'activity trip number relabel failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_activity_trip_number ON public.business_activity_logs;

CREATE TRIGGER trg_business_activity_trip_number
  BEFORE INSERT ON public.business_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.business_activity_use_trip_number();

COMMENT ON FUNCTION public.business_activity_use_trip_number() IS
  'Rewrites entity_label on business_booking activity rows to the trip number, keeping the booking number in metadata.booking_number. Never raises.';


-- The one writer the trigger above cannot help: it fires AFTER DELETE on
-- business_bookings, so by the time the log row is inserted the booking is gone
-- and the lookup finds nothing. It has OLD in hand, so it labels itself.
--
-- Safe to re-issue: no migration after 20260805_business_activity_capture_triggers
-- touches this function, and the live definition still matches that source.
CREATE OR REPLACE FUNCTION public.log_business_booking_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  a RECORD;
BEGIN
  BEGIN
    -- Both business delete routes use the service-role client, so auth.uid() is
    -- NULL here and this trigger cannot tell an owner from an admin. The routes
    -- log explicitly with the right actor before deleting; skip if they did.
    IF EXISTS (
      SELECT 1 FROM business_activity_logs
      WHERE entity_id = OLD.id
        AND action IN ('booking.deleted', 'booking.bulk_deleted')
    ) THEN
      RETURN OLD;
    END IF;

    SELECT * INTO a FROM resolve_business_actor(OLD.business_account_id);

    PERFORM log_business_activity(
      p_business_account_id    => OLD.business_account_id,
      p_action                 => 'booking.deleted',
      p_category               => 'booking',
      p_actor_type             => a.actor_type,
      p_actor_name             => a.actor_name,
      p_actor_auth_user_id     => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id,
      p_actor_role             => a.actor_role,
      p_severity               => 'critical',
      p_entity_type            => 'business_booking',
      p_entity_id              => OLD.id,
      -- Trip number first, matching every other booking surface. COALESCE keeps
      -- pre-20260611 rows, which have no trip number, on the booking number.
      p_entity_label           => COALESCE(OLD.trip_number, OLD.booking_number),
      p_amount                 => OLD.total_price,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'previous_status', OLD.booking_status,
        'pickup_at', OLD.pickup_datetime,
        'customer_name', OLD.customer_name,
        'refund_issued', false,
        'booking_number', OLD.booking_number
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'booking delete activity log failed: %', SQLERRM;
  END;

  RETURN OLD;
END;
$$;
