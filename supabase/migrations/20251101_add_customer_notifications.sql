-- Add customer notification support
-- This migration adds RLS policies and triggers for customer-side real-time notifications

-- =====================================================
-- RLS POLICIES FOR CUSTOMERS
-- =====================================================

-- Allow customers to view their own notifications
CREATE POLICY "Customers can view their own notifications"
ON notifications
FOR SELECT
USING (
  auth.uid() = user_id
  AND category IN ('booking', 'payment', 'system')
);

-- Allow customers to update their own notifications (mark as read)
CREATE POLICY "Customers can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTION TO CREATE CUSTOMER NOTIFICATIONS
-- =====================================================

-- Create notification for a customer (identified by user_id directly)
CREATE OR REPLACE FUNCTION create_customer_notification(
  p_user_id UUID,
  p_category notification_category,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert notification for the customer
  INSERT INTO notifications (
    user_id,
    category,
    type,
    title,
    message,
    data,
    link,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_category,
    p_type,
    p_title,
    p_message,
    p_data,
    p_link,
    FALSE,
    NOW()
  );
END;
$$;

COMMENT ON FUNCTION create_customer_notification IS
  'Creates a notification for a customer by user_id';

-- =====================================================
-- TRIGGER: NOTIFY CUSTOMER ON BOOKING STATUS CHANGE
-- =====================================================

CREATE OR REPLACE FUNCTION notify_customer_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  status_label TEXT;
BEGIN
  -- Only notify on status changes (not initial creation)
  IF OLD IS NOT NULL AND NEW.booking_status != OLD.booking_status THEN
    -- Get booking number
    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

    -- Map status to friendly label
    status_label := CASE NEW.booking_status
      WHEN 'pending' THEN 'Pending Assignment'
      WHEN 'assigned' THEN 'Assigned to Vendor'
      WHEN 'confirmed' THEN 'Confirmed'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'completed' THEN 'Completed'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.booking_status
    END;

    -- Create notification for customer
    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_status_changed',
      'Booking Status Updated',
      'Your booking #' || COALESCE(booking_num, NEW.id::TEXT) || ' is now ' || status_label,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'old_status', OLD.booking_status,
        'new_status', NEW.booking_status
      ),
      '/customer/bookings/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_customer_booking_status_changed ON bookings;

CREATE TRIGGER trigger_notify_customer_booking_status_changed
AFTER UPDATE OF booking_status ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_customer_booking_status_changed();

COMMENT ON FUNCTION notify_customer_booking_status_changed IS
  'Notifies customer when their booking status changes';

-- =====================================================
-- TRIGGER: NOTIFY CUSTOMER ON DRIVER ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION notify_customer_driver_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  driver_name TEXT;
  vendor_name TEXT;
BEGIN
  -- Notify when driver is newly assigned or changed
  IF NEW.driver_id IS NOT NULL AND
     (OLD IS NULL OR OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN

    -- Get booking details
    SELECT b.booking_number INTO booking_num
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    -- Get driver name
    SELECT d.full_name INTO driver_name
    FROM drivers d
    WHERE d.id = NEW.driver_id
    LIMIT 1;

    -- Get vendor name
    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

    -- Get customer_id from booking
    PERFORM create_customer_notification(
      (SELECT customer_id FROM bookings WHERE id = NEW.booking_id LIMIT 1),
      'booking'::notification_category,
      'driver_assigned',
      'Driver Assigned',
      'Driver ' || COALESCE(driver_name, 'assigned') || ' from ' || COALESCE(vendor_name, 'vendor') ||
      ' has been assigned to your booking #' || COALESCE(booking_num, NEW.booking_id::TEXT),
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'driver_id', NEW.driver_id,
        'driver_name', driver_name,
        'vendor_id', NEW.vendor_id,
        'vendor_name', vendor_name
      ),
      '/customer/bookings/' || NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_customer_driver_assigned ON booking_assignments;

CREATE TRIGGER trigger_notify_customer_driver_assigned
AFTER INSERT OR UPDATE ON booking_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_customer_driver_assigned();

COMMENT ON FUNCTION notify_customer_driver_assigned IS
  'Notifies customer when a driver is assigned to their booking';

-- =====================================================
-- TRIGGER: NOTIFY CUSTOMER ON VEHICLE ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION notify_customer_vehicle_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  vehicle_make TEXT;
  vehicle_model TEXT;
BEGIN
  -- Notify when vehicle is newly assigned or changed
  IF NEW.vehicle_id IS NOT NULL AND
     (OLD IS NULL OR OLD.vehicle_id IS NULL OR OLD.vehicle_id != NEW.vehicle_id) THEN

    -- Get booking number
    SELECT b.booking_number INTO booking_num
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    -- Get vehicle details
    SELECT v.make, v.model INTO vehicle_make, vehicle_model
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id
    LIMIT 1;

    -- Create notification for customer
    PERFORM create_customer_notification(
      (SELECT customer_id FROM bookings WHERE id = NEW.booking_id LIMIT 1),
      'booking'::notification_category,
      'vehicle_assigned',
      'Vehicle Assigned',
      'A ' || COALESCE(vehicle_make || ' ' || vehicle_model, 'vehicle') ||
      ' has been assigned to your booking #' || COALESCE(booking_num, NEW.booking_id::TEXT),
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'assignment_id', NEW.id,
        'booking_number', booking_num,
        'vehicle_id', NEW.vehicle_id,
        'vehicle_make', vehicle_make,
        'vehicle_model', vehicle_model
      ),
      '/customer/bookings/' || NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_customer_vehicle_assigned ON booking_assignments;

CREATE TRIGGER trigger_notify_customer_vehicle_assigned
AFTER INSERT OR UPDATE ON booking_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_customer_vehicle_assigned();

COMMENT ON FUNCTION notify_customer_vehicle_assigned IS
  'Notifies customer when a vehicle is assigned to their booking';

-- =====================================================
-- TRIGGER: NOTIFY CUSTOMER ON BOOKING CANCELLATION
-- =====================================================

CREATE OR REPLACE FUNCTION notify_customer_booking_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
BEGIN
  -- Only notify when status changes TO cancelled
  IF OLD IS NOT NULL AND NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN

    -- Get booking number
    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

    -- Create notification for customer
    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_cancelled',
      'Booking Cancelled',
      'Your booking #' || COALESCE(booking_num, NEW.id::TEXT) || ' has been cancelled',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'cancelled_at', NOW()
      ),
      '/customer/bookings/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_customer_booking_cancelled ON bookings;

CREATE TRIGGER trigger_notify_customer_booking_cancelled
AFTER UPDATE OF booking_status ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_customer_booking_cancelled();

COMMENT ON FUNCTION notify_customer_booking_cancelled IS
  'Notifies customer when their booking is cancelled';

-- =====================================================
-- SUMMARY
-- =====================================================

COMMENT ON TABLE notifications IS
  'Customer notifications added 2025-11-01. Triggers: booking status changes, driver/vehicle assignment, cancellations';
