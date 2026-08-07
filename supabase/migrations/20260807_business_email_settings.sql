-- =====================================================================================
-- Per-business SMTP credentials for white-label sending
-- =====================================================================================
-- Each business account may configure its own SMTP server so that mail to its customers
-- leaves from its own domain instead of the platform's.
--
-- WHY A SEPARATE TABLE, NOT COLUMNS ON business_accounts
--
--   1. The SELECT policy "Business users view own account" from
--      20250103_create_business_rls_policies.sql is membership-only:
--        id IN (SELECT business_account_id FROM business_users WHERE auth_user_id = auth.uid())
--      No role check, no is_active check. Every staff member of a tenant can therefore
--      read the entire business_accounts row straight through PostgREST. RLS is
--      row-level, so a credential column there cannot be hidden from them.
--
--   2. log_business_account_settings_change() in
--      20260805_business_activity_capture_triggers.sql writes raw OLD/NEW diffs into
--      business_activity_logs.changes with no redaction, and that table is exportable.
--      A credential column on business_accounts would be copied into it verbatim.
--
--   3. lib/business/api-utils.ts getBusinessBySubdomain / getBusinessByCustomDomain both
--      select('*'), so every column added to business_accounts widens what those return.
--
-- get_business_by_custom_domain (20251120_...) is unaffected either way: it is
-- SECURITY DEFINER with an explicit RETURNS TABLE column list.
-- =====================================================================================

CREATE TABLE IF NOT EXISTS public.business_email_settings (
  business_account_id uuid PRIMARY KEY
    REFERENCES public.business_accounts(id) ON DELETE CASCADE,

  -- Off until the owner has proved the credentials work. Enforced by the API rather
  -- than a CHECK, because rotating a password would otherwise have to disable sending
  -- mid-flight.
  enabled boolean NOT NULL DEFAULT false,

  -- Transport. Generic SMTP only: Resend is smtp.resend.com:587 with the username
  -- literally 'resend' and the API key as the password.
  smtp_host     text    NOT NULL CHECK (btrim(smtp_host) <> '' AND length(smtp_host) <= 255),
  smtp_port     integer NOT NULL DEFAULT 587 CHECK (smtp_port BETWEEN 1 AND 65535),
  -- true  = implicit TLS on connect (465)
  -- false = plaintext connect then STARTTLS (587/25/2525)
  smtp_secure   boolean NOT NULL DEFAULT false,
  smtp_username text    NOT NULL CHECK (length(smtp_username) <= 320),

  -- AES-256-GCM envelope produced by lib/email/transport/crypto.ts:
  --   v1:<key_version>:<iv_b64>:<tag_b64>:<ciphertext_b64>
  -- The additional authenticated data binds the ciphertext to this business_account_id,
  -- so a row copied into another tenant fails to decrypt rather than silently sending
  -- as them. NEVER granted to authenticated: see the GRANT block below.
  smtp_password_encrypted   text        NOT NULL,
  smtp_password_key_version smallint    NOT NULL DEFAULT 1,
  smtp_password_updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Envelope identity.
  from_name  text NOT NULL CHECK (btrim(from_name) <> '' AND length(from_name) <= 100),
  from_email text NOT NULL CHECK (from_email ~* '^[^@[:space:]<>,;]+@[^@[:space:]<>,;]+\.[a-z]{2,}$'),
  reply_to   text CHECK (reply_to IS NULL OR
                         reply_to ~* '^[^@[:space:]<>,;]+@[^@[:space:]<>,;]+\.[a-z]{2,}$'),

  -- UI affordance only. The stored config is always plain SMTP; this drives which help
  -- text and DNS checklist the owner is shown.
  provider_preset text NOT NULL DEFAULT 'custom' CHECK (provider_preset IN
    ('custom','resend','gmail','ses','mailgun','postmark','sendgrid')),

  -- When a send fails on the tenant transport we retry once on the platform one, which
  -- necessarily changes the From header to the platform address. That is a visible
  -- white-label leak, so it is the tenant's choice. Default on, because mail delivered
  -- with the wrong From beats a booking confirmation that never arrives. Every
  -- occurrence is recorded in business_email_log with status 'fell_back'.
  allow_platform_fallback boolean NOT NULL DEFAULT true,

  -- Connection health, written by the test-send route and by the sender.
  last_test_at         timestamptz,
  last_test_status     text CHECK (last_test_status IN ('success','failure')),
  -- Owner-safe summary only. The raw SMTP dialogue lives in business_email_log.
  last_test_error      text CHECK (length(last_test_error) <= 500),
  last_success_at      timestamptz,
  -- At 3 the sender stops attempting the tenant transport altogether.
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_email_settings IS
  'Per-tenant SMTP credentials for white-label sending. One row per business account. '
  'smtp_password_encrypted is AES-256-GCM and is NOT granted to authenticated: read it '
  'only with the service-role client. Because the GRANT is column-scoped, select(''*'') '
  'from an authenticated session returns 42501 - always name the safe columns.';

COMMENT ON COLUMN public.business_email_settings.smtp_password_encrypted IS
  'v1:<key_version>:<iv_b64>:<tag_b64>:<ct_b64>. Key from EMAIL_ENCRYPTION_KEY, falling '
  'back to ENCRYPTION_KEY. AAD is ''business_smtp_password:'' || business_account_id.';

COMMENT ON COLUMN public.business_email_settings.allow_platform_fallback IS
  'When true, a failed tenant send is retried on platform credentials, which changes the '
  'From header to the platform address. Logged as ''fell_back''.';

-- The only useful non-primary-key index: "which tenants send their own mail", for support.
CREATE INDEX IF NOT EXISTS idx_business_email_settings_enabled
  ON public.business_email_settings (business_account_id)
  WHERE enabled;

DROP TRIGGER IF EXISTS trg_business_email_settings_updated_at ON public.business_email_settings;
CREATE TRIGGER trg_business_email_settings_updated_at
  BEFORE UPDATE ON public.business_email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================================
-- RLS and grants
-- =====================================================================================
-- Two independent barriers. The policy restricts which rows an owner can see; the
-- column-scoped GRANT makes the ciphertext unreachable from any browser session even if
-- a policy is later written wrong. A policy bug alone is not enough to leak.

ALTER TABLE public.business_email_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_email_settings FROM anon, authenticated;

GRANT SELECT (
  business_account_id, enabled,
  smtp_host, smtp_port, smtp_secure, smtp_username,
  smtp_password_updated_at, smtp_password_key_version,
  from_name, from_email, reply_to, provider_preset,
  allow_platform_fallback,
  last_test_at, last_test_status, last_test_error,
  last_success_at, consecutive_failures,
  created_at, updated_at
) ON public.business_email_settings TO authenticated;

DROP POLICY IF EXISTS "Business owners read own email settings" ON public.business_email_settings;
CREATE POLICY "Business owners read own email settings"
  ON public.business_email_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.business_users bu
    WHERE bu.auth_user_id = auth.uid()
      AND bu.business_account_id = business_email_settings.business_account_id
      AND bu.role = 'owner'
      AND bu.is_active
  ));

DROP POLICY IF EXISTS "Admins read all email settings" ON public.business_email_settings;
CREATE POLICY "Admins read all email settings"
  ON public.business_email_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- Deliberately no INSERT/UPDATE/DELETE policy and no such grant. Absence of a policy is
-- denial. Every write goes through app/api/business/settings/email with the service-role
-- client, which is the only place the plaintext password is ever handled.
