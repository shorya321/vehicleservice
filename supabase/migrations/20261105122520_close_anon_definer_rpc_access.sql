-- Phase A: close anonymous access to internal SECURITY DEFINER functions.
--
-- Every function below had EXECUTE granted to PUBLIC and anon (Supabase default),
-- so anyone holding the public anon key could call them through PostgREST and
-- skip the API route checks. No public page calls any of them (checked every
-- rpc() caller on 2026-11-05).
--
-- Not touched on purpose: search_locations, get_popular_locations,
-- get_business_by_custom_domain (public pages), is_admin,
-- user_has_vendor_application, platform_timezone (used in RLS policies and
-- views), currency helpers, and all trigger functions.

-- 1. Membership check used by the business-data functions.
CREATE OR REPLACE FUNCTION public.can_access_business_account(p_business_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    coalesce(auth.role(), '') = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND (
        EXISTS (
          SELECT 1 FROM public.business_users bu
          WHERE bu.auth_user_id = auth.uid()
            AND bu.business_account_id = p_business_account_id
            AND bu.is_active = true
        )
        OR public.is_admin(auth.uid())
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_business_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_business_account(uuid) TO authenticated, service_role;

-- 2. Add the check as the first statement of the five business-data functions.
--    The bodies are edited in place (first BEGIN only), so nothing else changes.
DO $do$
DECLARE
  r record;
  v_def text;
  v_guard text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname,
           CASE p.proname WHEN 'get_business_payment_methods' THEN 'p_business_id'
                          ELSE 'p_business_account_id' END AS arg,
           CASE p.proname WHEN 'get_transaction_statistics' THEN 'RETURN ''{}''::json;'
                          ELSE 'RETURN;' END AS deny
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('export_transactions', 'get_transaction_statistics',
                        'search_transactions', 'generate_monthly_statement_data',
                        'get_business_payment_methods')
  LOOP
    v_def := pg_get_functiondef(r.oid);
    IF position('can_access_business_account' in v_def) > 0 THEN
      CONTINUE; -- already guarded, keep the migration re-runnable
    END IF;
    IF regexp_count(v_def, E'\nBEGIN\n') <> 1 THEN
      RAISE EXCEPTION 'Unexpected body shape for %', r.proname;
    END IF;
    v_guard := E'\nBEGIN\n  IF NOT public.can_access_business_account(' || r.arg || E') THEN\n    '
               || r.deny || E'\n  END IF;\n';
    EXECUTE overlay(v_def PLACING v_guard
                    FROM position(E'\nBEGIN\n' in v_def) FOR length(E'\nBEGIN\n'));
  END LOOP;
END
$do$;

-- 3. Remove anonymous access. Logged-in users and the server keep it.
REVOKE EXECUTE ON FUNCTION
  public.export_transactions(uuid, timestamptz, timestamptz, text[], varchar, integer),
  public.get_transaction_statistics(uuid, timestamptz, timestamptz, text[], numeric, numeric, varchar),
  public.search_transactions(uuid, text, integer),
  public.generate_monthly_statement_data(uuid, integer, integer),
  public.get_business_payment_methods(uuid),
  public.create_admin_notification(notification_category, text, text, text, jsonb, text),
  public.create_business_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.create_customer_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.create_vendor_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.get_business_booking_counts(),
  public.generate_quotation_number(uuid),
  public.log_user_activity(uuid, text, jsonb, inet, text),
  public.record_wallet_notification(uuid, varchar, varchar, varchar, text, text, jsonb),
  public.check_low_balance_alert(uuid),
  public.update_last_low_balance_alert(uuid),
  public.update_notification_status(uuid, varchar, text)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.export_transactions(uuid, timestamptz, timestamptz, text[], varchar, integer),
  public.get_transaction_statistics(uuid, timestamptz, timestamptz, text[], numeric, numeric, varchar),
  public.search_transactions(uuid, text, integer),
  public.generate_monthly_statement_data(uuid, integer, integer),
  public.get_business_payment_methods(uuid),
  public.create_admin_notification(notification_category, text, text, text, jsonb, text),
  public.create_business_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.create_customer_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.create_vendor_notification(uuid, notification_category, text, text, text, jsonb, text),
  public.get_business_booking_counts(),
  public.generate_quotation_number(uuid),
  public.log_user_activity(uuid, text, jsonb, inet, text),
  public.record_wallet_notification(uuid, varchar, varchar, varchar, text, text, jsonb),
  public.check_low_balance_alert(uuid),
  public.update_last_low_balance_alert(uuid),
  public.update_notification_status(uuid, varchar, text)
TO authenticated, service_role;

-- 4. Server only: email lookup and the admin id list.
REVOKE EXECUTE ON FUNCTION
  public.get_business_user_by_email(text),
  public.get_admin_user_ids()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.get_business_user_by_email(text),
  public.get_admin_user_ids()
TO service_role;

-- 5. Dead Stripe Connect functions (their columns no longer exist). Access
--    removed, functions kept so this stays reversible.
REVOKE EXECUTE ON FUNCTION
  public.decrypt_stripe_access_token(uuid),
  public.decrypt_stripe_refresh_token(uuid),
  public.encrypt_and_store_stripe_tokens(uuid, text, text, varchar),
  public.disconnect_stripe_account(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.decrypt_stripe_access_token(uuid),
  public.decrypt_stripe_refresh_token(uuid),
  public.encrypt_and_store_stripe_tokens(uuid, text, text, varchar),
  public.disconnect_stripe_account(uuid)
TO service_role;
