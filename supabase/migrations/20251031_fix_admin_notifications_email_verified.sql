-- Fix: Allow all admins to receive notifications regardless of email_verified status
-- Issue: admin@vehicleservice.com (email_verified=false) was not receiving notifications
-- Solution: Remove email_verified requirement from get_admin_user_ids()

-- Drop and recreate the function without email_verified filter
CREATE OR REPLACE FUNCTION get_admin_user_ids()
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM profiles
  WHERE role = 'admin';
  -- Removed: AND email_verified = true
  -- Reason: Admin accounts are typically created manually and should receive
  -- notifications regardless of email verification status
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function comment
COMMENT ON FUNCTION get_admin_user_ids IS 'Returns list of all admin user IDs (verification not required for notifications)';
