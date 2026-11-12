-- Applied 2026-11-12 via Supabase MCP apply_migration (recorded version 20261112113442).
--
-- Logged-in users could call the four notification writers directly with the
-- public key and send any notification to any admin, business, customer or vendor.
-- Every legitimate caller keeps working:
--   * 22 trigger functions, all SECURITY DEFINER owned by postgres, so the
--     privilege check runs as postgres, not as the signed-in user;
--   * the business booking API routes, which call them with the service role.
-- Visitors (anon) already lost access in 20261105122520. Undo: GRANT back
-- (UNDO_20261112113442_close_authenticated_notification_rpc_access.sql.txt).
REVOKE EXECUTE ON FUNCTION public.create_admin_notification(notification_category, text, text, text, jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_business_notification(uuid, notification_category, text, text, text, jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_customer_notification(uuid, notification_category, text, text, text, jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_vendor_notification(uuid, notification_category, text, text, text, jsonb, text) FROM authenticated;
