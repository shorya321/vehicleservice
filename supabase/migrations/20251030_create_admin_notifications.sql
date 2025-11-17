-- Create notification category enum
CREATE TYPE notification_category AS ENUM (
  'booking',
  'user',
  'vendor_application',
  'review',
  'payment',
  'system'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_user_category ON notifications(user_id, category, created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view their own notifications
CREATE POLICY "Admins can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Admins can update their own notifications
CREATE POLICY "Admins can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function: Get all admin user IDs
CREATE OR REPLACE FUNCTION get_admin_user_ids()
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM profiles
  WHERE role = 'admin' AND email_verified = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification for all admins
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_category notification_category,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_link TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  admin_id UUID;
BEGIN
  FOR admin_id IN SELECT user_id FROM get_admin_user_ids() LOOP
    INSERT INTO notifications (user_id, category, type, title, message, data, link)
    VALUES (admin_id, p_category, p_type, p_title, p_message, p_data, p_link);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID,
  p_category notification_category DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_category IS NULL THEN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND category = p_category AND is_read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: New booking created
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  customer_name_display TEXT;
BEGIN
  -- Get customer name from customer_name or lookup in profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Trigger Function: New vendor application
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_vendor_application
  AFTER INSERT ON vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_vendor_application();

-- Trigger Function: Booking assignment rejected
CREATE OR REPLACE FUNCTION notify_assignment_rejected()
RETURNS TRIGGER AS $$
DECLARE
  vendor_name TEXT;
  booking_num TEXT;
BEGIN
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    -- Get vendor name
    vendor_name := (
      SELECT COALESCE(p.full_name, p.email, 'Vendor')
      FROM profiles p
      WHERE p.id = NEW.vendor_id
      LIMIT 1
    );

    -- Get booking number
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_assignment_rejected
  AFTER UPDATE ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assignment_rejected();

-- Trigger Function: New user registration
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- Trigger Function: New review submitted
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if reviews table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    CREATE TRIGGER trigger_notify_new_review
      AFTER INSERT ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_review();
  END IF;
END $$;

-- Trigger Function: Payment failed
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_payment_failed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_failed();

-- Comment for documentation
COMMENT ON TABLE notifications IS 'Stores in-app notifications for admin users';
COMMENT ON FUNCTION create_admin_notification IS 'Creates notification for all admin users';
COMMENT ON FUNCTION get_admin_user_ids IS 'Returns list of all verified admin user IDs';
