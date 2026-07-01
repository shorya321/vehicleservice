-- Add in-app admin notification trigger for new business registrations
-- When a business account is created, notify all admins via the existing notification system

CREATE OR REPLACE FUNCTION notify_new_business_registration()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_admin_notification(
    'user'::notification_category,
    'business_registered',
    'New Business Registration',
    COALESCE(NEW.business_name, 'A business') || ' has registered and is pending approval',
    jsonb_build_object(
      'business_id', NEW.id,
      'business_name', NEW.business_name,
      'business_email', NEW.business_email,
      'contact_person', NEW.contact_person_name,
      'subdomain', NEW.subdomain
    ),
    '/admin/businesses/' || NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_business_registration
  AFTER INSERT ON business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_business_registration();
