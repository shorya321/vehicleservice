-- Notify the business when one of its bookings is created.
--
-- Until now a created booking produced no in-app notification for the business at all. Cancel and
-- delete both call create_business_notification, and business_bookings already carries
-- trigger_notify_admin_business_booking_created, but that one routes through
-- create_admin_notification to admins. The business-facing trigger,
-- trigger_notify_business_booking_status_changed, is AFTER UPDATE OF booking_status, and
-- create_booking_with_wallet_deduction inserts the row already 'confirmed', so no status UPDATE
-- ever follows and it cannot fire on creation. The result was a feed that reported cancellations
-- and deletions of bookings it never announced.
--
-- This lives in a trigger rather than in POST /api/business/bookings for two reasons: quotation
-- conversion (lib/business/quotations/convert-item.ts) calls the same RPC and currently sends
-- nothing at all, and a trigger runs inside the booking transaction rather than as a
-- fire-and-forget RPC that a serverless freeze can cut off.

CREATE OR REPLACE FUNCTION notify_business_booking_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_auth_id UUID;
  v_owner_auth_id UUID;
  v_booking_ref TEXT;
  v_title TEXT;
  v_message TEXT;
  v_data JSONB;
  v_link TEXT;
BEGIN
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

    v_title := 'New Booking - #' || v_booking_ref;
    v_message := 'Booking #' || v_booking_ref || ' for ' || COALESCE(NEW.customer_name, 'your customer')
                 || ' has been created';
    v_link := '/business/bookings/' || NEW.id;
    v_data := jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'business_account_id', NEW.business_account_id,
      'customer_name', NEW.customer_name,
      'total_price', NEW.total_price
    );

    -- The member who created it. Skipped when created_by_user_id is null, which is the case that
    -- silently drops the notification entirely in the three older triggers - the owner branch below
    -- still fires there.
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

    -- The owner, so shared-wallet spend by staff is visible. Deduped: an owner booking for
    -- themselves gets one row, not two.
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
$$;

COMMENT ON FUNCTION notify_business_booking_created() IS
  'Sends the booking-created in-app notification to the creating member and the account owner. Category must stay ''booking'': the notifications RLS policy for business users allows only booking, payment and system, and the realtime client applies the same list.';

DROP TRIGGER IF EXISTS trigger_notify_business_booking_created ON business_bookings;

CREATE TRIGGER trigger_notify_business_booking_created
  AFTER INSERT ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_booking_created();
