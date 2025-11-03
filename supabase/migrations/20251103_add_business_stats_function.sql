-- Add helper function for admin dashboard
-- Get booking counts for all business accounts

CREATE OR REPLACE FUNCTION get_business_booking_counts()
RETURNS TABLE (
  business_account_id UUID,
  total_bookings BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    business_account_id,
    COUNT(*) as total_bookings
  FROM business_bookings
  GROUP BY business_account_id;
$$;

COMMENT ON FUNCTION get_business_booking_counts IS
  'Returns booking counts for each business account for admin dashboard';
