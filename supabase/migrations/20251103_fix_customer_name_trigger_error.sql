-- Fix trigger functions that reference non-existent customer_name field
-- This migration corrects the notify_new_booking and notify_payment_failed functions
-- to remove references to NEW.customer_name which doesn't exist in the bookings table

-- Trigger Function: New booking created (FIXED)
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_name_display TEXT;
BEGIN
  -- Get customer name from profiles lookup only (customer_name field doesn't exist in bookings)
  customer_name_display := COALESCE(
    (SELECT full_name FROM profiles WHERE id = NEW.customer_id LIMIT 1),
    'Guest'
  );

  PERFORM create_admin_notification(
    'booking'::notification_category,
    'booking_created',
    'New Booking Received',
    'Booking #' || NEW.booking_number || ' from ' || customer_name_display,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'customer_id', NEW.customer_id
    ),
    '/admin/bookings/' || NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Payment failed (FIXED)
CREATE OR REPLACE FUNCTION notify_payment_failed()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  booking_num TEXT;
BEGIN
  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    -- Get customer name from profiles lookup only (customer_name field doesn't exist in bookings)
    customer_name := COALESCE(
      (SELECT full_name FROM profiles WHERE id = NEW.customer_id LIMIT 1),
      'Customer'
    );

    booking_num := NEW.booking_number;

    PERFORM create_admin_notification(
      'payment'::notification_category,
      'payment_failed',
      'Payment Failed',
      'Payment failed for booking #' || booking_num || ' (' || customer_name || ')',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'customer_id', NEW.customer_id
      ),
      '/admin/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION notify_new_booking IS 'Fixed: Removed non-existent customer_name field reference';
COMMENT ON FUNCTION notify_payment_failed IS 'Fixed: Removed non-existent customer_name field reference';
