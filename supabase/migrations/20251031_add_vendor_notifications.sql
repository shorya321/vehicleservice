-- Add vendor notification support to existing notifications table

-- RLS Policy: Vendors can view their own notifications
CREATE POLICY "Vendors can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- RLS Policy: Vendors can update their own notifications
CREATE POLICY "Vendors can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- Function: Get vendor user ID from vendor application ID
CREATE OR REPLACE FUNCTION get_vendor_user_id(p_vendor_app_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM vendor_applications
  WHERE id = p_vendor_app_id
  LIMIT 1;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification for a specific vendor
CREATE OR REPLACE FUNCTION create_vendor_notification(
  p_vendor_app_id UUID,
  p_category notification_category,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_link TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id for this vendor application
  v_user_id := get_vendor_user_id(p_vendor_app_id);

  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, category, type, title, message, data, link)
    VALUES (v_user_id, p_category, p_type, p_title, p_message, p_data, p_link);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Notify vendor of new booking assignment
CREATE OR REPLACE FUNCTION notify_vendor_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  pickup_location TEXT;
  pickup_time TIMESTAMPTZ;
BEGIN
  -- Only notify on initial assignment
  IF NEW.status = 'assigned' AND (OLD.status IS NULL OR OLD.status != 'assigned') THEN
    -- Get booking details
    SELECT b.booking_number, b.pickup_address, b.pickup_datetime
    INTO booking_num, pickup_location, pickup_time
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    PERFORM create_vendor_notification(
      NEW.vendor_id,
      'booking'::notification_category,
      'booking_assigned',
      'New Booking Assignment',
      'You have been assigned booking #' || COALESCE(booking_num, NEW.booking_id::TEXT),
      jsonb_build_object(
        'booking_id', NEW.booking_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_vendor_booking_assigned
  AFTER INSERT OR UPDATE ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_booking_assigned();

-- Trigger Function: Notify vendor of booking status changes
CREATE OR REPLACE FUNCTION notify_vendor_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  vendor_app_id UUID;
  booking_num TEXT;
  status_label TEXT;
BEGIN
  -- Only notify on status changes, not initial creation
  IF NEW.booking_status != OLD.booking_status THEN
    -- Get vendor assignment for this booking
    SELECT vendor_id INTO vendor_app_id
    FROM booking_assignments
    WHERE booking_id = NEW.id
    ORDER BY assigned_at DESC
    LIMIT 1;

    -- Only notify if booking is assigned to a vendor
    IF vendor_app_id IS NOT NULL THEN
      booking_num := NEW.booking_number;

      -- Map status to readable label
      status_label := CASE NEW.booking_status
        WHEN 'confirmed' THEN 'Confirmed'
        WHEN 'in_progress' THEN 'In Progress'
        WHEN 'completed' THEN 'Completed'
        WHEN 'cancelled' THEN 'Cancelled'
        ELSE NEW.booking_status
      END;

      PERFORM create_vendor_notification(
        vendor_app_id,
        'booking'::notification_category,
        'booking_status_changed',
        'Booking Status Updated',
        'Booking #' || booking_num || ' is now ' || status_label,
        jsonb_build_object(
          'booking_id', NEW.id,
          'booking_number', booking_num,
          'old_status', OLD.booking_status,
          'new_status', NEW.booking_status
        ),
        '/vendor/bookings'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_vendor_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_booking_status_changed();

-- Trigger Function: Notify vendor of application status changes
CREATE OR REPLACE FUNCTION notify_vendor_application_status()
RETURNS TRIGGER AS $$
DECLARE
  status_label TEXT;
  message_text TEXT;
BEGIN
  -- Only notify on status changes
  IF NEW.status != OLD.status THEN
    status_label := CASE NEW.status
      WHEN 'approved' THEN 'Approved'
      WHEN 'rejected' THEN 'Rejected'
      WHEN 'pending' THEN 'Pending Review'
      ELSE NEW.status
    END;

    message_text := CASE NEW.status
      WHEN 'approved' THEN 'Congratulations! Your vendor application has been approved. You can now start managing bookings.'
      WHEN 'rejected' THEN 'Your vendor application has been reviewed. Please contact support for more information.'
      ELSE 'Your vendor application status has been updated to: ' || status_label
    END;

    PERFORM create_vendor_notification(
      NEW.id,
      'vendor_application'::notification_category,
      'application_status_changed',
      'Application Status: ' || status_label,
      message_text,
      jsonb_build_object(
        'application_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      '/vendor/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_vendor_application_status
  AFTER UPDATE ON vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_application_status();

-- Trigger Function: Notify vendor of payment received
CREATE OR REPLACE FUNCTION notify_vendor_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  vendor_app_id UUID;
  booking_num TEXT;
BEGIN
  -- Only notify when payment status changes to completed
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Get vendor assignment for this booking
    SELECT vendor_id INTO vendor_app_id
    FROM booking_assignments
    WHERE booking_id = NEW.id
    ORDER BY assigned_at DESC
    LIMIT 1;

    -- Only notify if booking is assigned to a vendor
    IF vendor_app_id IS NOT NULL THEN
      booking_num := NEW.booking_number;

      PERFORM create_vendor_notification(
        vendor_app_id,
        'payment'::notification_category,
        'payment_received',
        'Payment Received',
        'Payment of $' || NEW.total_price || ' received for booking #' || booking_num,
        jsonb_build_object(
          'booking_id', NEW.id,
          'booking_number', booking_num,
          'amount', NEW.total_price
        ),
        '/vendor/bookings'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_vendor_payment_received
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_payment_received();

-- Trigger Function: Notify vendor when assignment is cancelled by admin
CREATE OR REPLACE FUNCTION notify_vendor_assignment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
BEGIN
  -- Notify when assignment status changes to cancelled or rejected
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status NOT IN ('cancelled', 'rejected') THEN
    -- Get booking number
    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.booking_id
    LIMIT 1;

    PERFORM create_vendor_notification(
      NEW.vendor_id,
      'booking'::notification_category,
      'assignment_cancelled',
      'Assignment ' || INITCAP(NEW.status),
      'Your assignment for booking #' || COALESCE(booking_num, NEW.booking_id::TEXT) || ' has been ' || NEW.status,
      jsonb_build_object(
        'booking_id', NEW.booking_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_vendor_assignment_cancelled
  AFTER UPDATE ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_vendor_assignment_cancelled();

-- Comment for documentation
COMMENT ON FUNCTION get_vendor_user_id IS 'Returns the user_id for a given vendor_applications.id';
COMMENT ON FUNCTION create_vendor_notification IS 'Creates notification for a specific vendor user';
COMMENT ON FUNCTION notify_vendor_booking_assigned IS 'Notifies vendor when a booking is assigned to them';
COMMENT ON FUNCTION notify_vendor_booking_status_changed IS 'Notifies vendor when their assigned booking status changes';
COMMENT ON FUNCTION notify_vendor_application_status IS 'Notifies vendor when their application status changes';
COMMENT ON FUNCTION notify_vendor_payment_received IS 'Notifies vendor when payment is received for their booking';
COMMENT ON FUNCTION notify_vendor_assignment_cancelled IS 'Notifies vendor when their assignment is cancelled or rejected';
