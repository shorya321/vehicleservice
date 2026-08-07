-- =====================================================================================
-- Per-tenant email delivery log
-- =====================================================================================
-- Answers the question a business owner actually asks: "did the confirmation for this
-- booking go out, when, to whom, and on whose mail server?"
--
-- Written best effort by lib/email/utils/email-log.ts. A failure to insert here must
-- never turn a delivered email into a reported failure.
--
-- WHAT IS DELIBERATELY NOT STORED
--   - No password, no SMTP username, no auth token. smtp_host only: support needs to
--     know which server was tried, never as whom.
--   - No HTML or text body. Bodies carry passenger names, addresses and, for the
--     password-reset template, a live token. Storing them would turn this into a
--     credential store and a second copy of PII outside the rules that govern
--     business_bookings. kind + subject + related_id answers every real question, and
--     the message can always be re-rendered from the booking row.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.business_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NULL means the message was platform mail rather than a tenant's.
  -- ON DELETE SET NULL rather than CASCADE: a closed account's delivery history is still
  -- evidence for a billing or deliverability dispute.
  business_account_id uuid REFERENCES public.business_accounts(id) ON DELETE SET NULL,

  -- e.g. 'business.booking.confirmation', 'business.smtp.test'. No CHECK constraint, for
  -- the same reason business_activity_logs.action has none: adding a template must never
  -- require a migration, and a constraint violation must never abort a send.
  kind text NOT NULL,

  to_email   text NOT NULL CHECK (length(to_email) <= 320),
  from_email text NOT NULL,
  reply_to   text,
  subject    text NOT NULL CHECK (length(subject) <= 500),

  provider text NOT NULL CHECK (provider IN ('business_smtp','platform_smtp')),
  status   text NOT NULL CHECK (status IN ('sent','failed','fell_back')),

  -- Host only, never the credentials that were used against it.
  smtp_host  text,
  message_id text,

  -- Owner-visible diagnostics. This is the tenant's own mail server talking to them, so
  -- the response is theirs to read, but it is truncated and must be passed through
  -- redactMailError() first: some servers echo the AUTH line back in a 535.
  error_code    text CHECK (length(error_code) <= 64),
  error_message text CHECK (length(error_message) <= 1000),

  duration_ms integer CHECK (duration_ms >= 0),
  attempt     smallint NOT NULL DEFAULT 1 CHECK (attempt >= 1),

  -- The booking, quotation or transaction this message belonged to.
  related_id uuid,

  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_email_log IS
  'Per-tenant email delivery log. Best effort: a failed insert here must never abort a '
  'send. Owner-readable, staff-invisible, no bodies and no credentials. Pruned by '
  'prune_business_email_log.';

COMMENT ON COLUMN public.business_email_log.provider IS
  'Which credentials the message physically went out on. The single most useful column '
  'here for support: business_smtp means the tenant''s own server, platform_smtp means ours.';

COMMENT ON COLUMN public.business_email_log.status IS
  'fell_back means the tenant transport failed and the message was re-sent on platform '
  'credentials, so it was delivered but with the platform From address.';

CREATE INDEX IF NOT EXISTS idx_business_email_log_account_created
  ON public.business_email_log (business_account_id, created_at DESC);

-- Drives the "your SMTP is failing" banner.
CREATE INDEX IF NOT EXISTS idx_business_email_log_failures
  ON public.business_email_log (business_account_id, created_at DESC)
  WHERE status <> 'sent';

-- Durable backstop for the test-send rate limit, which must survive a deploy.
CREATE INDEX IF NOT EXISTS idx_business_email_log_kind
  ON public.business_email_log (business_account_id, kind, created_at DESC);

-- The retention sweep scans by age across all tenants.
CREATE INDEX IF NOT EXISTS idx_business_email_log_created_at
  ON public.business_email_log (created_at);

ALTER TABLE public.business_email_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_email_log FROM anon, authenticated;
GRANT SELECT ON public.business_email_log TO authenticated;

DROP POLICY IF EXISTS "Business owners read own email log" ON public.business_email_log;
CREATE POLICY "Business owners read own email log"
  ON public.business_email_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.business_users bu
    WHERE bu.auth_user_id = auth.uid()
      AND bu.business_account_id = business_email_log.business_account_id
      AND bu.role = 'owner'
      AND bu.is_active
  ));

DROP POLICY IF EXISTS "Admins read all email log" ON public.business_email_log;
CREATE POLICY "Admins read all email log"
  ON public.business_email_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- No INSERT policy: only the service-role client writes, so a tenant cannot forge or
-- erase its own delivery history.

-- =====================================================================================
-- Retention
-- =====================================================================================
-- Two limits in one pass. The age cutoff is the actual retention rule; the per-tenant
-- cap stops one misbehaving integration from crowding out every other tenant's rows
-- inside the retention window.

CREATE OR REPLACE FUNCTION public.prune_business_email_log(
  p_retention_days       integer DEFAULT 90,
  p_max_rows_per_account integer DEFAULT 5000
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted integer := 0;
  v_capped  integer := 0;
BEGIN
  DELETE FROM business_email_log
  WHERE created_at < now() - make_interval(days => GREATEST(p_retention_days, 7));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  WITH ranked AS (
    SELECT id, row_number() OVER (
      PARTITION BY business_account_id ORDER BY created_at DESC
    ) AS rn
    FROM business_email_log
  )
  DELETE FROM business_email_log b
  USING ranked r
  WHERE b.id = r.id
    AND r.rn > GREATEST(p_max_rows_per_account, 100);
  GET DIAGNOSTICS v_capped = ROW_COUNT;

  RETURN v_deleted + v_capped;
EXCEPTION WHEN OTHERS THEN
  -- Housekeeping must never take a cron route down.
  RAISE WARNING 'prune_business_email_log failed: %', SQLERRM;
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_business_email_log(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_business_email_log(integer, integer) TO service_role;

COMMENT ON FUNCTION public.prune_business_email_log IS
  'Deletes log rows older than p_retention_days (floor 7) and trims each account to its '
  'newest p_max_rows_per_account rows (floor 100). Returns the number of rows removed.';
