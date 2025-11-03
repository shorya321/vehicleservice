-- Add notification for admins when vendor accepts and assigns booking
-- This is a minimal addition - does NOT modify any existing triggers or functions

-- =====================================================
-- ADMIN NOTIFICATION: VENDOR ACCEPTED BOOKING
-- =====================================================

CREATE OR REPLACE FUNCTION notify_admin_booking_accepted()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
  driver_name TEXT;
  vehicle_info TEXT;
BEGIN
  -- Only notify when status changes TO 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Get vendor name
    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

    -- Get booking number
    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.booking_id
    LIMIT 1;

    -- Get driver name (if assigned)
    SELECT vd.first_name || ' ' || vd.last_name INTO driver_name
    FROM vendor_drivers vd
    WHERE vd.id = NEW.driver_id
    LIMIT 1;

    -- Get vehicle info (if assigned)
    SELECT v.make || ' ' || v.model INTO vehicle_info
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id
    LIMIT 1;

    -- Create notification for all admins
    PERFORM create_admin_notification(
      'booking'::notification_category,
      'booking_accepted',
      'Vendor Accepted Booking',
      COALESCE(vendor_name, 'Vendor') || ' accepted booking #' || COALESCE(booking_num, NEW.booking_id::TEXT) ||
      CASE
        WHEN driver_name IS NOT NULL AND vehicle_info IS NOT NULL
        THEN ' (Driver: ' || driver_name || ', Vehicle: ' || vehicle_info || ')'
        ELSE ''
      END,
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'vendor_id', NEW.vendor_id,
        'vendor_name', vendor_name,
        'driver_id', NEW.driver_id,
        'driver_name', driver_name,
        'vehicle_id', NEW.vehicle_id,
        'vehicle_info', vehicle_info
      ),
      '/admin/bookings/' || NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor acceptance
DROP TRIGGER IF EXISTS trigger_notify_admin_booking_accepted ON booking_assignments;

CREATE TRIGGER trigger_notify_admin_booking_accepted
  AFTER UPDATE ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_booking_accepted();

COMMENT ON FUNCTION notify_admin_booking_accepted IS
  'Notifies all admins when a vendor accepts a booking and assigns driver/vehicle';

-- Note: Realtime is already enabled on notifications table
