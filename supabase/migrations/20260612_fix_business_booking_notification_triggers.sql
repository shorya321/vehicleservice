-- Fix: Three notification triggers now handle business bookings (business_booking_id)
-- Previously only queried `bookings` table via booking_id, which is NULL for business bookings.
-- Pattern follows the already-fixed notify_vendor_assignment_cancelled() from 20260610.
-- Also restores 'pending' status check in notify_vendor_booking_assigned (regressed by search_path migration)
-- and fixes vendor name lookup in notify_assignment_rejected (was querying wrong table).

-- =====================================================
-- 1. notify_vendor_booking_assigned
-- =====================================================

CREATE OR REPLACE FUNCTION notify_vendor_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  pickup_location TEXT;
  pickup_time TIMESTAMPTZ;
BEGIN
  IF NEW.status IN ('assigned', 'pending') AND
     (OLD IS NULL OR OLD.vendor_id IS NULL OR OLD.vendor_id != NEW.vendor_id) THEN

    IF NEW.booking_id IS NOT NULL THEN
      SELECT b.booking_number, b.pickup_address, b.pickup_datetime
      INTO booking_num, pickup_location, pickup_time
      FROM bookings b
      WHERE b.id = NEW.booking_id
      LIMIT 1;
    END IF;

    IF booking_num IS NULL AND NEW.business_booking_id IS NOT NULL THEN
      SELECT b.booking_number, b.pickup_address, b.pickup_datetime
      INTO booking_num, pickup_location, pickup_time
      FROM business_bookings b
      WHERE b.id = NEW.business_booking_id
      LIMIT 1;
    END IF;

    PERFORM create_vendor_notification(
      NEW.vendor_id,
      'booking'::notification_category,
      'booking_assigned',
      'New Booking Assignment',
      'You have been assigned booking #' || COALESCE(booking_num, COALESCE(NEW.booking_id, NEW.business_booking_id)::TEXT),
      jsonb_build_object(
        'booking_id', COALESCE(NEW.booking_id, NEW.business_booking_id),
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'pickup_address', pickup_location,
        'pickup_datetime', pickup_time
      ),
      '/vendor/bookings'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- =====================================================
-- 2. notify_admin_booking_accepted
-- =====================================================

CREATE OR REPLACE FUNCTION notify_admin_booking_accepted()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
  driver_name TEXT;
  vehicle_info TEXT;
  effective_booking_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    effective_booking_id := COALESCE(NEW.booking_id, NEW.business_booking_id);

    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

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

    SELECT vd.first_name || ' ' || vd.last_name INTO driver_name
    FROM vendor_drivers vd
    WHERE vd.id = NEW.driver_id
    LIMIT 1;

    SELECT v.make || ' ' || v.model INTO vehicle_info
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id
    LIMIT 1;

    PERFORM create_admin_notification(
      'booking'::notification_category,
      'booking_accepted',
      'Vendor Accepted Booking',
      COALESCE(vendor_name, 'Vendor') || ' accepted booking #' || COALESCE(booking_num, effective_booking_id::TEXT) ||
      CASE
        WHEN driver_name IS NOT NULL AND vehicle_info IS NOT NULL
        THEN ' (Driver: ' || driver_name || ', Vehicle: ' || vehicle_info || ')'
        ELSE ''
      END,
      jsonb_build_object(
        'booking_id', effective_booking_id,
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'vendor_id', NEW.vendor_id,
        'vendor_name', vendor_name,
        'driver_id', NEW.driver_id,
        'driver_name', driver_name,
        'vehicle_id', NEW.vehicle_id,
        'vehicle_info', vehicle_info
      ),
      '/admin/bookings/' || effective_booking_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- =====================================================
-- 3. notify_assignment_rejected
-- =====================================================

CREATE OR REPLACE FUNCTION notify_assignment_rejected()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
  effective_booking_id UUID;
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    effective_booking_id := COALESCE(NEW.booking_id, NEW.business_booking_id);

    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

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

    PERFORM create_admin_notification(
      'booking'::notification_category,
      'assignment_rejected',
      'Vendor Rejected Assignment',
      COALESCE(vendor_name, 'Vendor') || ' rejected booking #' || COALESCE(booking_num, effective_booking_id::TEXT),
      jsonb_build_object(
        'booking_id', effective_booking_id,
        'assignment_id', NEW.id,
        'vendor_id', NEW.vendor_id
      ),
      '/admin/bookings/' || effective_booking_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
