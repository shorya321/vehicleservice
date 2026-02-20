-- Fix: vendor application trigger references wrong column name
-- OLD: NEW.company_name (does not exist)
-- NEW: NEW.business_name (correct column)

CREATE OR REPLACE FUNCTION notify_new_vendor_application()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'vendor_application'::notification_category,
    'application_submitted',
    'New Vendor Application',
    COALESCE(NEW.business_name, 'A vendor') || ' has submitted an application',
    jsonb_build_object(
      'application_id', NEW.id,
      'business_name', NEW.business_name,
      'user_id', NEW.user_id
    ),
    '/admin/vendor-applications/' || NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
