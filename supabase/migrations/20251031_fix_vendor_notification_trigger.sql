-- Fix vendor notification trigger to work with current 'pending' status workflow
-- This updates the trigger condition to recognize the status values actually used by the admin

-- Update the trigger function to recognize both 'pending' and 'assigned' status
CREATE OR REPLACE FUNCTION notify_vendor_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  booking_num TEXT;
  pickup_location TEXT;
  pickup_time TIMESTAMPTZ;
BEGIN
  -- Notify on initial assignment OR reassignment to different vendor
  -- Check for status 'pending' OR 'assigned' (current workflow uses 'pending')
  IF NEW.status IN ('assigned', 'pending') AND
     (OLD IS NULL OR OLD.vendor_id IS NULL OR OLD.vendor_id != NEW.vendor_id) THEN

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

-- The trigger already exists, so we don't need to recreate it
-- Just updating the function above will make it work with the new logic

COMMENT ON FUNCTION notify_vendor_booking_assigned IS
  'Notifies vendor when a booking is assigned (status=pending or assigned) or reassigned to them';
