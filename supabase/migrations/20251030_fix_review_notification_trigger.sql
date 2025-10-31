-- Fix notify_new_review trigger to use customer_id instead of user_id
-- The reviews table uses customer_id, not user_id

CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
BEGIN
  -- Lookup customer name from profiles using customer_id (not user_id)
  customer_name := (
    SELECT COALESCE(full_name, email, 'A customer')
    FROM profiles
    WHERE id = NEW.customer_id
    LIMIT 1
  );

  -- Create admin notification for new review
  PERFORM create_admin_notification(
    'review'::notification_category,
    'review_submitted',
    'New Review Submitted',
    customer_name || ' submitted a ' || NEW.rating || '-star review',
    jsonb_build_object(
      'review_id', NEW.id,
      'customer_id', NEW.customer_id,
      'rating', NEW.rating
    ),
    '/admin/reviews'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
