-- Fix: notify_vendor_assignment_cancelled() trigger now handles business bookings
-- Previously only queried `bookings` table, causing NULL message for business booking reassignments

CREATE OR REPLACE FUNCTION notify_vendor_assignment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
BEGIN
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status NOT IN ('cancelled', 'rejected') THEN
    IF NEW.booking_id IS NOT NULL THEN
      SELECT booking_number INTO booking_num
      FROM bookings
      WHERE id = NEW.booking_id
      LIMIT 1;
    END IF;

    IF booking_num IS NULL AND NEW.business_booking_id IS NOT NULL THEN
      SELECT booking_number INTO booking_num
      FROM business_bookings
      WHERE id = NEW.business_booking_id
      LIMIT 1;
    END IF;

    PERFORM create_vendor_notification(
      NEW.vendor_id,
      'booking'::notification_category,
      'assignment_cancelled',
      'Assignment ' || INITCAP(NEW.status),
      'Your assignment for booking #' || COALESCE(booking_num, COALESCE(NEW.booking_id, NEW.business_booking_id)::TEXT, 'Unknown') || ' has been ' || NEW.status,
      jsonb_build_object(
        'booking_id', COALESCE(NEW.booking_id, NEW.business_booking_id),
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'status', NEW.status,
        'notes', NEW.notes
      ),
      '/vendor/bookings'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
