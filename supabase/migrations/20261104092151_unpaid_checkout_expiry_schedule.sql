-- Runs expire_unpaid_bookings() inside the database every 5 minutes, so the
-- job does not depend on where the app is hosted.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.schedule(
  'expire-unpaid-bookings',
  '*/5 * * * *',
  $$SELECT public.expire_unpaid_bookings()$$
);

-- Admin settings page: is the schedule installed? Admin-only, read-only.
CREATE OR REPLACE FUNCTION public.get_unpaid_expiry_job()
RETURNS TABLE (schedule text, active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT j.schedule, j.active FROM cron.job j WHERE j.jobname = 'expire-unpaid-bookings' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_unpaid_expiry_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unpaid_expiry_job() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unpaid_expiry_job() TO service_role;
