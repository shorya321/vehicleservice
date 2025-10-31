-- Ensure the review notification trigger exists and is working
-- This fixes the issue where the trigger was never created if reviews table didn't exist during initial migration

-- Drop existing trigger if it exists (in case it was created with wrong function)
DROP TRIGGER IF EXISTS trigger_notify_new_review ON reviews;

-- Recreate the trigger with the corrected function
-- (The notify_new_review function was already fixed to use customer_id instead of user_id)
CREATE TRIGGER trigger_notify_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

-- Verify trigger was created
COMMENT ON TRIGGER trigger_notify_new_review ON reviews IS 'Creates admin notifications when customers submit new reviews';
