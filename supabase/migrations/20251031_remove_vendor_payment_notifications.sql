-- Remove vendor payment notification trigger and function
-- This feature is not needed in the current workflow and can be re-implemented in the future if required

-- Drop the trigger that notifies vendors when payment is received
DROP TRIGGER IF EXISTS trigger_notify_vendor_payment_received ON bookings;

-- Drop the function that creates payment notifications for vendors
DROP FUNCTION IF EXISTS notify_vendor_payment_received();

-- Add comment for documentation
COMMENT ON TABLE bookings IS
  'Payment notifications for vendors were removed 2025-10-31 as they are not needed in current workflow. Can be re-implemented if required in future.';
