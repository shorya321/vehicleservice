-- Migration: Add booking datetime modifications table and triggers
-- Description: Allows business users to modify pickup_datetime up to 3 hours before pickup
-- with full audit logging and vendor notifications

-- =====================================================
-- 1. Create audit table for datetime modifications
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_datetime_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES business_bookings(id) ON DELETE CASCADE,
  previous_datetime TIMESTAMPTZ NOT NULL,
  new_datetime TIMESTAMPTZ NOT NULL,
  modified_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  modification_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE booking_datetime_modifications IS 'Audit log for business booking date/time modifications';
COMMENT ON COLUMN booking_datetime_modifications.previous_datetime IS 'The pickup_datetime before modification';
COMMENT ON COLUMN booking_datetime_modifications.new_datetime IS 'The new pickup_datetime after modification';
COMMENT ON COLUMN booking_datetime_modifications.modification_reason IS 'Optional reason provided by user for the change';

-- =====================================================
-- 2. Create index for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_booking_datetime_mods_booking_id
  ON booking_datetime_modifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_datetime_mods_created_at
  ON booking_datetime_modifications(created_at DESC);

-- =====================================================
-- 3. Enable RLS
-- =====================================================
ALTER TABLE booking_datetime_modifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS Policies
-- =====================================================

-- Business users can view modifications for their bookings
CREATE POLICY "Business users can view their booking modifications"
  ON booking_datetime_modifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_bookings bb
      JOIN business_users bu ON bu.business_account_id = bb.business_account_id
      WHERE bb.id = booking_datetime_modifications.booking_id
      AND bu.auth_user_id = auth.uid()
    )
  );

-- Business users can insert modifications for their bookings
CREATE POLICY "Business users can create booking modifications"
  ON booking_datetime_modifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_bookings bb
      JOIN business_users bu ON bu.business_account_id = bb.business_account_id
      WHERE bb.id = booking_datetime_modifications.booking_id
      AND bu.auth_user_id = auth.uid()
    )
    AND modified_by_user_id = auth.uid()
  );

-- Admins can view all modifications
CREATE POLICY "Admins can view all booking modifications"
  ON booking_datetime_modifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Vendors can view modifications for their assigned bookings
CREATE POLICY "Vendors can view modifications for assigned bookings"
  ON booking_datetime_modifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM booking_assignments ba
      JOIN vendor_applications va ON va.id = ba.vendor_id
      WHERE ba.business_booking_id = booking_datetime_modifications.booking_id
      AND va.user_id = auth.uid()
      AND ba.status IN ('pending', 'accepted')
    )
  );

-- =====================================================
-- 5. Notification function for vendor
-- =====================================================
CREATE OR REPLACE FUNCTION notify_booking_datetime_modified()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking RECORD;
  v_vendor_user_id UUID;
  v_booking_number TEXT;
BEGIN
  -- Get booking details with assignment info
  SELECT
    bb.booking_number,
    bb.customer_name,
    bb.pickup_address,
    ba.vendor_id
  INTO v_booking
  FROM business_bookings bb
  LEFT JOIN booking_assignments ba ON ba.business_booking_id = bb.id
    AND ba.status IN ('pending', 'accepted')
  WHERE bb.id = NEW.booking_id;

  -- If assigned, notify vendor
  IF v_booking.vendor_id IS NOT NULL THEN
    -- Get vendor's user_id
    SELECT va.user_id INTO v_vendor_user_id
    FROM vendor_applications va
    WHERE va.id = v_booking.vendor_id;

    IF v_vendor_user_id IS NOT NULL THEN
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
        v_vendor_user_id,
        'booking',
        'booking_datetime_modified',
        'Booking Time Changed',
        format(
          'Booking %s pickup time has been changed. Customer: %s. New time: %s',
          v_booking.booking_number,
          v_booking.customer_name,
          to_char(NEW.new_datetime AT TIME ZONE 'UTC', 'Mon DD, YYYY at HH:MI AM')
        ),
        jsonb_build_object(
          'booking_id', NEW.booking_id,
          'booking_number', v_booking.booking_number,
          'customer_name', v_booking.customer_name,
          'pickup_address', v_booking.pickup_address,
          'previous_datetime', NEW.previous_datetime,
          'new_datetime', NEW.new_datetime,
          'modification_reason', NEW.modification_reason
        ),
        format('/vendor/bookings/%s', NEW.booking_id),
        false,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. Create trigger
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notify_booking_datetime_modified ON booking_datetime_modifications;

CREATE TRIGGER trigger_notify_booking_datetime_modified
  AFTER INSERT ON booking_datetime_modifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_datetime_modified();

-- =====================================================
-- 7. Grant permissions
-- =====================================================
GRANT SELECT, INSERT ON booking_datetime_modifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
