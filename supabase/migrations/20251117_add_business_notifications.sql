-- Add business notifications system
-- Migration: 20251117_add_business_notifications
-- Date: 2025-11-17
-- Description: Implement notification system for business users when they create bookings and receive assignments

-- ============================================================
-- PART 1: RLS POLICIES FOR BUSINESS USERS
-- ============================================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Business users can view their notifications" ON notifications;

-- Create policy for business users to view their notifications
-- Business users can see notifications in categories: booking, payment, system
CREATE POLICY "Business users can view their notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT auth_user_id
    FROM business_users
    WHERE business_account_id IN (
      SELECT business_account_id
      FROM business_users
      WHERE auth_user_id = auth.uid()
    )
  )
  AND category IN ('booking', 'payment', 'system')
);

-- ============================================================
-- PART 2: HELPER FUNCTION TO CREATE BUSINESS NOTIFICATIONS
-- ============================================================

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS create_business_notification(UUID, notification_category, TEXT, TEXT, TEXT, JSONB, TEXT);

-- Helper function to create a notification for a specific business user
-- Similar pattern to create_vendor_notification and create_customer_notification
CREATE OR REPLACE FUNCTION create_business_notification(
  p_business_user_auth_id UUID,  -- The auth_user_id from business_users table
  p_category notification_category,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_link TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for the business user
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
    p_business_user_auth_id,
    p_category,
    p_type,
    p_title,
    p_message,
    p_data,
    p_link,
    false,
    NOW()
  );
END;
$$;

-- ============================================================
-- PART 3: TRIGGER - NOTIFY ADMIN WHEN BUSINESS USER CREATES BOOKING
-- ============================================================

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_admin_business_booking_created ON business_bookings;
DROP FUNCTION IF EXISTS notify_admin_business_booking_created();

-- Function to notify all admins when a business user creates a booking
CREATE OR REPLACE FUNCTION notify_admin_business_booking_created() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_name_display TEXT;
  customer_name_display TEXT;
BEGIN
  -- Get business account name
  SELECT business_name INTO business_name_display
  FROM business_accounts
  WHERE id = NEW.business_account_id;

  -- Use customer name from booking
  customer_name_display := NEW.customer_name;

  -- Notify all admins about new business booking
  PERFORM create_admin_notification(
    'booking'::notification_category,
    'business_booking_created',
    'New Business Booking',
    'Business booking #' || NEW.booking_number || ' created by ' || business_name_display || ' for ' || customer_name_display,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'business_account_id', NEW.business_account_id,
      'business_name', business_name_display,
      'customer_name', customer_name_display
    ),
    '/admin/bookings/' || NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger on business_bookings INSERT
CREATE TRIGGER trigger_notify_admin_business_booking_created
  AFTER INSERT ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_business_booking_created();

-- ============================================================
-- PART 4: TRIGGER - NOTIFY BUSINESS USER AND VENDOR WHEN BOOKING ASSIGNED
-- ============================================================

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_business_booking_assignment ON booking_assignments;
DROP FUNCTION IF EXISTS notify_business_booking_assignment();

-- Function to notify business user and vendor when admin assigns a business booking
CREATE OR REPLACE FUNCTION notify_business_booking_assignment() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_booking RECORD;
  business_auth_user_id UUID;
  business_name_display TEXT;
  vendor_name_display TEXT;
BEGIN
  -- Check if this is a business booking assignment
  SELECT bb.*, ba.business_name
  INTO business_booking
  FROM business_bookings bb
  LEFT JOIN business_accounts ba ON bb.business_account_id = ba.id
  WHERE bb.id = NEW.business_booking_id;

  -- Only proceed if this is a business booking
  IF business_booking.id IS NOT NULL THEN
    -- Get the business user's auth_user_id who created the booking
    IF business_booking.created_by_user_id IS NOT NULL THEN
      SELECT auth_user_id INTO business_auth_user_id
      FROM business_users
      WHERE id = business_booking.created_by_user_id;
    END IF;

    -- Get vendor name
    SELECT business_name INTO vendor_name_display
    FROM vendor_applications
    WHERE id = NEW.vendor_id;

    -- Notify the business user who created the booking
    IF business_auth_user_id IS NOT NULL THEN
      PERFORM create_business_notification(
        business_auth_user_id,
        'booking'::notification_category,
        'booking_assigned',
        'Booking Assigned to Vendor',
        'Your booking #' || business_booking.booking_number || ' has been assigned to ' || COALESCE(vendor_name_display, 'a vendor'),
        jsonb_build_object(
          'booking_id', business_booking.id,
          'booking_number', business_booking.booking_number,
          'vendor_id', NEW.vendor_id,
          'vendor_name', vendor_name_display,
          'assignment_id', NEW.id
        ),
        '/business/bookings/' || business_booking.id
      );
    END IF;

    -- Notify the vendor (reuse existing vendor notification function)
    PERFORM create_vendor_notification(
      NEW.vendor_id,
      'booking'::notification_category,
      'business_booking_assigned',
      'New Business Booking Assignment',
      'You have been assigned business booking #' || business_booking.booking_number || ' from ' || business_booking.business_name,
      jsonb_build_object(
        'booking_id', business_booking.id,
        'booking_number', business_booking.booking_number,
        'business_name', business_booking.business_name,
        'assignment_id', NEW.id
      ),
      '/vendor/bookings'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on booking_assignments INSERT
CREATE TRIGGER trigger_notify_business_booking_assignment
  AFTER INSERT ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_booking_assignment();

-- ============================================================
-- PART 5: TRIGGER - NOTIFY BUSINESS USER ON BOOKING STATUS CHANGE
-- ============================================================

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_business_booking_status_changed ON business_bookings;
DROP FUNCTION IF EXISTS notify_business_booking_status_changed();

-- Function to notify business user when booking status changes
CREATE OR REPLACE FUNCTION notify_business_booking_status_changed() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_auth_user_id UUID;
  status_message TEXT;
  notification_title TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
    -- Get the business user's auth_user_id who created the booking
    IF NEW.created_by_user_id IS NOT NULL THEN
      SELECT auth_user_id INTO business_auth_user_id
      FROM business_users
      WHERE id = NEW.created_by_user_id;
    END IF;

    -- Set message based on new status
    CASE NEW.booking_status
      WHEN 'confirmed' THEN
        notification_title := 'Booking Confirmed';
        status_message := 'Your booking #' || NEW.booking_number || ' has been confirmed';
      WHEN 'cancelled' THEN
        notification_title := 'Booking Cancelled';
        status_message := 'Your booking #' || NEW.booking_number || ' has been cancelled';
      WHEN 'completed' THEN
        notification_title := 'Booking Completed';
        status_message := 'Your booking #' || NEW.booking_number || ' has been completed';
      WHEN 'in_progress' THEN
        notification_title := 'Booking In Progress';
        status_message := 'Your booking #' || NEW.booking_number || ' is now in progress';
      ELSE
        notification_title := 'Booking Status Updated';
        status_message := 'Your booking #' || NEW.booking_number || ' status has been updated to ' || NEW.booking_status;
    END CASE;

    -- Notify business user
    IF business_auth_user_id IS NOT NULL THEN
      PERFORM create_business_notification(
        business_auth_user_id,
        'booking'::notification_category,
        'booking_status_changed',
        notification_title,
        status_message,
        jsonb_build_object(
          'booking_id', NEW.id,
          'booking_number', NEW.booking_number,
          'old_status', OLD.booking_status,
          'new_status', NEW.booking_status
        ),
        '/business/bookings/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on business_bookings UPDATE
CREATE TRIGGER trigger_notify_business_booking_status_changed
  AFTER UPDATE OF booking_status ON business_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_booking_status_changed();

-- ============================================================
-- PART 6: TRIGGER - NOTIFY BUSINESS USER WHEN VENDOR ACCEPTS/REJECTS
-- ============================================================

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_notify_business_assignment_status_changed ON booking_assignments;
DROP FUNCTION IF EXISTS notify_business_assignment_status_changed();

-- Function to notify business user when vendor accepts or rejects assignment
CREATE OR REPLACE FUNCTION notify_business_assignment_status_changed() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_booking RECORD;
  business_auth_user_id UUID;
  vendor_name_display TEXT;
  notification_title TEXT;
  status_message TEXT;
BEGIN
  -- Only proceed if status changed to 'accepted' or 'rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'rejected') THEN
    -- Get business booking details
    SELECT bb.id, bb.booking_number, bb.created_by_user_id
    INTO business_booking
    FROM business_bookings bb
    WHERE bb.id = NEW.business_booking_id;

    -- Only proceed if this is a business booking
    IF business_booking.id IS NOT NULL THEN
      -- Get the business user's auth_user_id
      IF business_booking.created_by_user_id IS NOT NULL THEN
        SELECT auth_user_id INTO business_auth_user_id
        FROM business_users
        WHERE id = business_booking.created_by_user_id;
      END IF;

      -- Get vendor name
      SELECT business_name INTO vendor_name_display
      FROM vendor_applications
      WHERE id = NEW.vendor_id;

      -- Set message based on new status
      IF NEW.status = 'accepted' THEN
        notification_title := 'Assignment Accepted';
        status_message := 'Vendor ' || COALESCE(vendor_name_display, 'service provider') || ' has accepted booking #' || business_booking.booking_number;
      ELSE
        notification_title := 'Assignment Rejected';
        status_message := 'Vendor ' || COALESCE(vendor_name_display, 'service provider') || ' has rejected booking #' || business_booking.booking_number;
      END IF;

      -- Notify business user
      IF business_auth_user_id IS NOT NULL THEN
        PERFORM create_business_notification(
          business_auth_user_id,
          'booking'::notification_category,
          'assignment_status_changed',
          notification_title,
          status_message,
          jsonb_build_object(
            'booking_id', business_booking.id,
            'booking_number', business_booking.booking_number,
            'vendor_id', NEW.vendor_id,
            'vendor_name', vendor_name_display,
            'assignment_id', NEW.id,
            'status', NEW.status
          ),
          '/business/bookings/' || business_booking.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on booking_assignments UPDATE
CREATE TRIGGER trigger_notify_business_assignment_status_changed
  AFTER UPDATE OF status ON booking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_assignment_status_changed();

-- ============================================================
-- LOG MIGRATION COMPLETION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Business notifications system added';
  RAISE NOTICE '✓ RLS policy created for business users';
  RAISE NOTICE '✓ Helper function create_business_notification() created';
  RAISE NOTICE '✓ Trigger for new business bookings → admin notifications';
  RAISE NOTICE '✓ Trigger for booking assignments → business user + vendor notifications';
  RAISE NOTICE '✓ Trigger for booking status changes → business user notifications';
  RAISE NOTICE '✓ Trigger for assignment acceptance/rejection → business user notifications';
END $$;
