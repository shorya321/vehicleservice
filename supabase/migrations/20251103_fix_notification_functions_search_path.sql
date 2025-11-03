-- Fix all notification trigger functions to include SET search_path
-- This resolves the "type notification_category does not exist" error
-- that occurs when these functions inherit an empty search_path from parent triggers

-- Migration: 20251103_fix_notification_functions_search_path.sql

-- =====================================================
-- ADMIN NOTIFICATION FUNCTIONS
-- =====================================================

-- 1. notify_new_booking
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_name_display TEXT;
BEGIN
  customer_name_display := COALESCE(
    NEW.customer_name,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 2. notify_new_vendor_application
CREATE OR REPLACE FUNCTION notify_new_vendor_application()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'vendor_application'::notification_category,
    'application_submitted',
    'New Vendor Application',
    COALESCE(NEW.company_name, 'A vendor') || ' has submitted an application',
    jsonb_build_object(
      'application_id', NEW.id,
      'company_name', NEW.company_name,
      'user_id', NEW.user_id
    ),
    '/admin/vendor-applications/' || NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. notify_assignment_rejected
CREATE OR REPLACE FUNCTION notify_assignment_rejected()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    vendor_name := (
      SELECT COALESCE(p.full_name, p.email, 'Vendor')
      FROM profiles p
      WHERE p.id = NEW.vendor_id
      LIMIT 1
    );

    booking_num := (
      SELECT booking_number
      FROM bookings
      WHERE id = NEW.booking_id
      LIMIT 1
    );

    PERFORM create_admin_notification(
      'booking'::notification_category,
      'assignment_rejected',
      'Vendor Rejected Assignment',
      vendor_name || ' rejected booking #' || COALESCE(booking_num, NEW.booking_id::TEXT),
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'assignment_id', NEW.id,
        'vendor_id', NEW.vendor_id
      ),
      '/admin/bookings/' || NEW.booking_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 4. notify_new_user (THIS IS THE ONE CAUSING THE ERROR)
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_display TEXT;
BEGIN
  IF NEW.role IN ('customer', 'vendor') THEN
    user_display := COALESCE(NEW.full_name, NEW.email, 'A user');

    PERFORM create_admin_notification(
      'user'::notification_category,
      'user_registered',
      'New User Registered',
      user_display || ' registered as ' || NEW.role,
      jsonb_build_object(
        'user_id', NEW.id,
        'role', NEW.role,
        'email', NEW.email
      ),
      '/admin/users'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 5. notify_new_review
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
BEGIN
  customer_name := (
    SELECT COALESCE(full_name, email, 'A customer')
    FROM profiles
    WHERE id = NEW.user_id
    LIMIT 1
  );

  PERFORM create_admin_notification(
    'review'::notification_category,
    'review_submitted',
    'New Review Submitted',
    customer_name || ' submitted a ' || NEW.rating || '-star review',
    jsonb_build_object(
      'review_id', NEW.id,
      'user_id', NEW.user_id,
      'rating', NEW.rating
    ),
    '/admin/reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 6. notify_payment_failed
CREATE OR REPLACE FUNCTION notify_payment_failed()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  booking_num TEXT;
BEGIN
  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    customer_name := COALESCE(
      NEW.customer_name,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 7. notify_admin_booking_accepted
CREATE OR REPLACE FUNCTION notify_admin_booking_accepted()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
  driver_name TEXT;
  vehicle_info TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.booking_id
    LIMIT 1;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- =====================================================
-- VENDOR NOTIFICATION FUNCTIONS
-- =====================================================

-- 8. notify_vendor_booking_assigned
CREATE OR REPLACE FUNCTION notify_vendor_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  pickup_location TEXT;
  pickup_time TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'assigned' AND (OLD.status IS NULL OR OLD.status != 'assigned') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 9. notify_vendor_booking_status_changed
CREATE OR REPLACE FUNCTION notify_vendor_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  vendor_app_id UUID;
  booking_num TEXT;
  status_label TEXT;
BEGIN
  IF NEW.booking_status != OLD.booking_status THEN
    SELECT vendor_id INTO vendor_app_id
    FROM booking_assignments
    WHERE booking_id = NEW.id
    ORDER BY assigned_at DESC
    LIMIT 1;

    IF vendor_app_id IS NOT NULL THEN
      booking_num := NEW.booking_number;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 10. notify_vendor_application_status
CREATE OR REPLACE FUNCTION notify_vendor_application_status()
RETURNS TRIGGER AS $$
DECLARE
  status_label TEXT;
  message_text TEXT;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 11. notify_vendor_payment_received
CREATE OR REPLACE FUNCTION notify_vendor_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  vendor_app_id UUID;
  booking_num TEXT;
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    SELECT vendor_id INTO vendor_app_id
    FROM booking_assignments
    WHERE booking_id = NEW.id
    ORDER BY assigned_at DESC
    LIMIT 1;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 12. notify_vendor_assignment_cancelled
CREATE OR REPLACE FUNCTION notify_vendor_assignment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
BEGIN
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status NOT IN ('cancelled', 'rejected') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- =====================================================
-- CUSTOMER NOTIFICATION FUNCTIONS
-- =====================================================

-- 13. notify_customer_booking_status_changed
CREATE OR REPLACE FUNCTION notify_customer_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  status_label TEXT;
BEGIN
  IF OLD IS NOT NULL AND NEW.booking_status != OLD.booking_status THEN
    SELECT booking_number INTO booking_num
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 14. notify_customer_driver_assigned
CREATE OR REPLACE FUNCTION notify_customer_driver_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  driver_name TEXT;
  vendor_name TEXT;
BEGIN
  IF NEW.driver_id IS NOT NULL AND
     (OLD IS NULL OR OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN

    SELECT b.booking_number INTO booking_num
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    SELECT d.full_name INTO driver_name
    FROM drivers d
    WHERE d.id = NEW.driver_id
    LIMIT 1;

    SELECT va.business_name INTO vendor_name
    FROM vendor_applications va
    WHERE va.id = NEW.vendor_id
    LIMIT 1;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 15. notify_customer_vehicle_assigned
CREATE OR REPLACE FUNCTION notify_customer_vehicle_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  vehicle_make TEXT;
  vehicle_model TEXT;
BEGIN
  IF NEW.vehicle_id IS NOT NULL AND
     (OLD IS NULL OR OLD.vehicle_id IS NULL OR OLD.vehicle_id != NEW.vehicle_id) THEN

    SELECT b.booking_number INTO booking_num
    FROM bookings b
    WHERE b.id = NEW.booking_id
    LIMIT 1;

    SELECT v.make, v.model INTO vehicle_make, vehicle_model
    FROM vehicles v
    WHERE v.id = NEW.vehicle_id
    LIMIT 1;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 16. notify_customer_booking_cancelled
CREATE OR REPLACE FUNCTION notify_customer_booking_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
BEGIN
  IF OLD IS NOT NULL AND NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
    SELECT booking_number INTO booking_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- =====================================================
-- DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION notify_new_booking IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_new_vendor_application IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_assignment_rejected IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_new_user IS 'Fixed: Added SET search_path TO public - THIS WAS CAUSING THE SIGNUP ERROR';
COMMENT ON FUNCTION notify_new_review IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_payment_failed IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_admin_booking_accepted IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_vendor_booking_assigned IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_vendor_booking_status_changed IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_vendor_application_status IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_vendor_payment_received IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_vendor_assignment_cancelled IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_customer_booking_status_changed IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_customer_driver_assigned IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_customer_vehicle_assigned IS 'Fixed: Added SET search_path TO public';
COMMENT ON FUNCTION notify_customer_booking_cancelled IS 'Fixed: Added SET search_path TO public';
