-- Business Activity Log - Step 1 (Migration A)
--
-- Owner-facing narrative of everything that happens inside a business account:
-- actions by the owner and staff, by platform admins, by vendors, by Stripe and
-- by the system.
--
-- This migration is a pure addition. It creates one table and three functions.
-- Nothing writes to the table yet; the writers land in later migrations.
--
-- Deliberately NOT reusing user_activity_logs:
--   1. Its user_id cascades from auth.users. Team removal hard-deletes the auth
--      user, so every row about a removed staff member would be destroyed at
--      exactly the moment the owner needs it.
--   2. It has no tenant column, so admin / vendor / Stripe actors (who have no
--      business_users row) cannot be scoped to a business.
--   3. Its INSERT policy is admin-only.
--   4. It holds platform-wide customer and vendor activity, so a policy bug
--      there would be a cross-role leak.

-- ============================================================================
-- TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant. The only foreign key on this table.
  business_account_id uuid NOT NULL
    REFERENCES public.business_accounts(id) ON DELETE CASCADE,

  -- Actor.
  -- Deliberately FK-free: these columns must outlive the auth.users row they
  -- describe. DELETE /api/business/team calls auth.admin.deleteUser(), which
  -- cascades profiles and business_users. actor_name is a snapshot taken at
  -- write time and must never be resolved by joining at read time.
  actor_type text NOT NULL CHECK (actor_type IN
    ('business_user', 'admin', 'vendor', 'system', 'customer')),
  actor_auth_user_id     uuid,
  actor_business_user_id uuid,
  actor_role  text,
  actor_name  text NOT NULL,
  actor_email text,

  -- What happened.
  -- action has NO check constraint on purpose. Some log writes run inside the
  -- money functions' transaction, so a check violation would abort a wallet
  -- credit over an audit row. action is constrained by a TypeScript string
  -- literal union at the call site instead, and adding a new action must never
  -- require a migration. category and severity are small closed sets and are
  -- safe to constrain.
  action   text NOT NULL,
  category text NOT NULL CHECK (category IN
    ('wallet', 'booking', 'quotation', 'team', 'settings', 'security', 'account', 'document')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN
    ('info', 'important', 'critical')),

  -- What it happened to. entity_label is a snapshot so the row still reads
  -- correctly after the entity is renamed or deleted.
  entity_type  text,
  entity_id    uuid,
  entity_label text,

  -- Detail. changes holds {"field": {"from": ..., "to": ...}} and drives the
  -- before/after diff in the UI.
  changes  jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Promoted out of metadata: the UI filters and sums these, and
  -- (metadata->>'amount')::numeric is unindexable and breaks on a typo'd key.
  amount   numeric(12, 2),
  currency varchar(3),

  -- Request origin. Populated for the security category only.
  ip_address inet,
  user_agent text,
  request_id text,

  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_activity_logs IS
  'Tenant-facing narrative of who did what inside a business account. '
  'BEST EFFORT and SECONDARY: writes are swallowed on failure and must never abort the '
  'action being logged. wallet_transactions, admin_wallet_audit_log and '
  'booking_datetime_modifications remain the systems of record. Never reconcile money '
  'from this table. Append-only for users (no INSERT/UPDATE/DELETE policy); service_role '
  'and the purge function still write, so this is not cryptographic immutability.';

COMMENT ON COLUMN public.business_activity_logs.actor_name IS
  'Snapshot of the actor display name at write time. Intentionally denormalized: the '
  'underlying auth user may be hard-deleted. Never resolve this by joining at read time.';

COMMENT ON COLUMN public.business_activity_logs.action IS
  'Stable dotted key, e.g. booking.cancelled. No CHECK constraint by design - see the '
  'table header. Validated by a TypeScript union in lib/business/activity/catalog.ts.';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary feed: owner scrolls their account newest first.
CREATE INDEX IF NOT EXISTS idx_bal_account_created
  ON public.business_activity_logs (business_account_id, created_at DESC);

-- Category filter chips.
CREATE INDEX IF NOT EXISTS idx_bal_account_category_created
  ON public.business_activity_logs (business_account_id, category, created_at DESC);

-- "What did this member do" filter.
CREATE INDEX IF NOT EXISTS idx_bal_account_actor_created
  ON public.business_activity_logs (business_account_id, actor_business_user_id, created_at DESC)
  WHERE actor_business_user_id IS NOT NULL;

-- Per-entity timeline ("history of this booking").
CREATE INDEX IF NOT EXISTS idx_bal_entity
  ON public.business_activity_logs (entity_type, entity_id, created_at DESC)
  WHERE entity_id IS NOT NULL;

-- Free-text search over the two snapshotted display fields.
CREATE INDEX IF NOT EXISTS idx_bal_actor_name_trgm
  ON public.business_activity_logs USING gin (actor_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bal_entity_label_trgm
  ON public.business_activity_logs USING gin (entity_label gin_trgm_ops)
  WHERE entity_label IS NOT NULL;

-- Idempotency gate. Mirrors uq_wallet_tx_stripe_pi in
-- 20260702_wallet_credit_idempotency.sql: collapses Stripe webhook retries and
-- the webhook / verify-payment race into a single row. The writer catches
-- unique_violation and returns NULL rather than treating it as an error.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bal_idempotent
  ON public.business_activity_logs (business_account_id, action, (metadata->>'idempotency_key'))
  WHERE metadata ? 'idempotency_key';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.business_activity_logs ENABLE ROW LEVEL SECURITY;

-- Deliberately NOT "FORCE ROW LEVEL SECURITY".
-- See 20260728_audit_vendor_application_edits.sql: a SECURITY DEFINER function
-- owned by postgres bypasses RLS only while relforcerowsecurity = false.
-- Enabling FORCE here would silently kill every trigger-based capture.

-- Two independent barriers against a forged row from a hijacked business
-- session holding the anon key: no INSERT grant, and no INSERT policy.
REVOKE ALL ON public.business_activity_logs FROM anon, authenticated;
GRANT SELECT ON public.business_activity_logs TO authenticated;

-- Owner of the tenant reads everything in their own account.
-- Predicate shape matches 20260721_business_role_rls.sql, including is_active.
DROP POLICY IF EXISTS "Business owners read tenant activity" ON public.business_activity_logs;
CREATE POLICY "Business owners read tenant activity"
  ON public.business_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_users bu
      WHERE bu.auth_user_id = auth.uid()
        AND bu.business_account_id = business_activity_logs.business_account_id
        AND bu.role = 'owner'
        AND bu.is_active
    )
  );

-- Platform admins read everything, for support.
-- NOTE: profiles has id and role. It does NOT have auth_user_id or user_role,
-- despite what 20250107_add_admin_wallet_controls.sql assumes. Do not copy that
-- predicate; it is the reason the four admin wallet-control functions in that
-- migration have never successfully executed.
DROP POLICY IF EXISTS "Admins read all business activity" ON public.business_activity_logs;
CREATE POLICY "Admins read all business activity"
  ON public.business_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- No staff SELECT policy: absence of a policy is denial, so staff read nothing.
-- No INSERT, UPDATE or DELETE policy for authenticated.

-- ============================================================================
-- WRITER
-- ============================================================================

-- One write path for everyone. Triggers and the money functions cannot call
-- TypeScript, so this must exist regardless; a second direct-insert path from
-- TS would drift in defaults and validation.
--
-- p_ip_address is TEXT, not INET, and this is load-bearing. PostgREST coerces
-- named arguments to the declared parameter type BEFORE the function body runs,
-- so a malformed X-Forwarded-For would raise 22P02 where the EXCEPTION block
-- cannot catch it, taking the caller's money transaction down with it. Casting
-- inside the body is what makes "this never throws" true rather than hopeful.
CREATE OR REPLACE FUNCTION public.log_business_activity(
  p_business_account_id    uuid,
  p_action                 text,
  p_category               text,
  p_actor_type             text,
  p_actor_name             text    DEFAULT NULL,
  p_actor_auth_user_id     uuid    DEFAULT NULL,
  p_actor_business_user_id uuid    DEFAULT NULL,
  p_actor_role             text    DEFAULT NULL,
  p_actor_email            text    DEFAULT NULL,
  p_severity               text    DEFAULT 'info',
  p_entity_type            text    DEFAULT NULL,
  p_entity_id              uuid    DEFAULT NULL,
  p_entity_label           text    DEFAULT NULL,
  p_changes                jsonb   DEFAULT NULL,
  p_metadata               jsonb   DEFAULT '{}'::jsonb,
  p_amount                 numeric DEFAULT NULL,
  p_currency               text    DEFAULT NULL,
  p_ip_address             text    DEFAULT NULL,
  p_user_agent             text    DEFAULT NULL,
  p_request_id             text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ip      inet;
  v_name    text := NULLIF(btrim(COALESCE(p_actor_name, '')), '');
  v_email   text := NULLIF(btrim(COALESCE(p_actor_email, '')), '');
  v_auth_id uuid := p_actor_auth_user_id;
  v_id      uuid;
BEGIN
  IF p_business_account_id IS NULL OR p_action IS NULL THEN
    RETURN NULL;
  END IF;

  -- Guarded cast: a malformed forwarded-for header must never cost us the row.
  BEGIN
    v_ip := NULLIF(btrim(COALESCE(p_ip_address, '')), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- Fallback actor name resolution, so triggers can pass NULL and still get a
  -- human-readable label. Callers that already know the name should pass it,
  -- because that snapshot survives the user being deleted.
  -- business_users.full_name and .email are both nullable and are NULL for
  -- accounts created before 20260720_business_staff_users.sql backfilled them,
  -- so this also picks up the auth id to drive the profiles fallback below.
  IF p_actor_business_user_id IS NOT NULL
     AND (v_name IS NULL OR v_auth_id IS NULL OR v_email IS NULL) THEN
    SELECT
      COALESCE(v_name, NULLIF(btrim(COALESCE(bu.full_name, bu.email, '')), '')),
      COALESCE(v_auth_id, bu.auth_user_id),
      COALESCE(v_email, NULLIF(btrim(COALESCE(bu.email, '')), ''))
    INTO v_name, v_auth_id, v_email
    FROM business_users bu
    WHERE bu.id = p_actor_business_user_id;
  END IF;

  IF (v_name IS NULL OR v_email IS NULL) AND v_auth_id IS NOT NULL THEN
    SELECT
      COALESCE(v_name, NULLIF(btrim(COALESCE(pr.full_name, pr.email, '')), '')),
      COALESCE(v_email, NULLIF(btrim(COALESCE(pr.email, '')), ''))
    INTO v_name, v_email
    FROM profiles pr
    WHERE pr.id = v_auth_id;
  END IF;

  INSERT INTO business_activity_logs (
    business_account_id,
    actor_type, actor_auth_user_id, actor_business_user_id,
    actor_role, actor_name, actor_email,
    action, category, severity,
    entity_type, entity_id, entity_label,
    changes, metadata,
    amount, currency,
    ip_address, user_agent, request_id
  ) VALUES (
    p_business_account_id,
    COALESCE(p_actor_type, 'system'),
    v_auth_id,
    p_actor_business_user_id,
    p_actor_role,
    COALESCE(v_name, 'Unknown'),
    v_email,
    p_action,
    p_category,
    COALESCE(p_severity, 'info'),
    p_entity_type,
    p_entity_id,
    LEFT(p_entity_label, 200),
    p_changes,
    COALESCE(p_metadata, '{}'::jsonb),
    p_amount,
    UPPER(NULLIF(btrim(COALESCE(p_currency, '')), '')),
    v_ip,
    LEFT(p_user_agent, 512),
    p_request_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;

EXCEPTION
  -- The idempotency gate fired. Expected, not an error.
  WHEN unique_violation THEN
    RETURN NULL;
  -- Anything else: warn to the Postgres log and carry on. Auditing must never
  -- abort the write it is describing. Same discipline as
  -- 20260728_audit_vendor_application_edits.sql.
  WHEN OTHERS THEN
    RAISE WARNING 'business activity log failed (action=%): %', p_action, SQLERRM;
    RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_business_activity(
  uuid, text, text, text, text, uuid, uuid, text, text, text,
  text, uuid, text, jsonb, jsonb, numeric, text, text, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.log_business_activity(
  uuid, text, text, text, text, uuid, uuid, text, text, text,
  text, uuid, text, jsonb, jsonb, numeric, text, text, text, text
) TO service_role;

COMMENT ON FUNCTION public.log_business_activity IS
  'Single write path for business_activity_logs. Never throws: returns NULL on any '
  'failure. service_role only - if authenticated could call this, a staff session could '
  'forge a row attributing an action to the owner.';

-- ============================================================================
-- BATCH WRITER
-- ============================================================================

-- Bulk operations (bulkDeleteBookings over 200 rows) must not be 200 round
-- trips. Callers set a shared metadata->>'batch_id' so the UI can collapse the
-- group into one expandable entry.
CREATE OR REPLACE FUNCTION public.log_business_activity_batch(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN 0;
  END IF;

  INSERT INTO business_activity_logs (
    business_account_id,
    actor_type, actor_auth_user_id, actor_business_user_id,
    actor_role, actor_name, actor_email,
    action, category, severity,
    entity_type, entity_id, entity_label,
    changes, metadata,
    amount, currency, request_id
  )
  SELECT
    x.business_account_id,
    COALESCE(x.actor_type, 'system'),
    x.actor_auth_user_id,
    x.actor_business_user_id,
    x.actor_role,
    COALESCE(NULLIF(btrim(COALESCE(x.actor_name, '')), ''), 'Unknown'),
    x.actor_email,
    x.action,
    x.category,
    COALESCE(x.severity, 'info'),
    x.entity_type,
    x.entity_id,
    LEFT(x.entity_label, 200),
    x.changes,
    COALESCE(x.metadata, '{}'::jsonb),
    x.amount,
    UPPER(NULLIF(btrim(COALESCE(x.currency, '')), '')),
    x.request_id
  FROM jsonb_to_recordset(p_rows) AS x(
    business_account_id    uuid,
    actor_type             text,
    actor_auth_user_id     uuid,
    actor_business_user_id uuid,
    actor_role             text,
    actor_name             text,
    actor_email            text,
    action                 text,
    category               text,
    severity               text,
    entity_type            text,
    entity_id              uuid,
    entity_label           text,
    changes                jsonb,
    metadata               jsonb,
    amount                 numeric,
    currency               text,
    request_id             text
  )
  WHERE x.business_account_id IS NOT NULL
    AND x.action IS NOT NULL
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'business activity batch log failed: %', SQLERRM;
  RETURN 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_business_activity_batch(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_business_activity_batch(jsonb) TO service_role;

-- ============================================================================
-- PURGE
-- ============================================================================

-- Manual, owner-triggered, age-based purge. Granted to authenticated (unlike
-- the writer) because the owner calls it directly from the portal.
--
-- The function writes an activity.purged row after deleting. That row is newer
-- than any cutoff, so it survives its own purge: history can be cleared, but
-- never silently.
CREATE OR REPLACE FUNCTION public.purge_business_activity(
  p_business_account_id uuid,
  p_before              timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner   business_users%ROWTYPE;
  v_deleted integer := 0;
BEGIN
  IF p_business_account_id IS NULL OR p_before IS NULL THEN
    RAISE EXCEPTION 'Business account and cutoff date are required';
  END IF;

  -- Authorization is checked here, not by RLS: this is SECURITY DEFINER, so it
  -- bypasses the table policies entirely.
  SELECT * INTO v_owner
  FROM business_users bu
  WHERE bu.auth_user_id = auth.uid()
    AND bu.business_account_id = p_business_account_id
    AND bu.role = 'owner'
    AND bu.is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized to purge activity for this business account';
  END IF;

  -- A cutoff in the future would delete the audit trail of the purge itself.
  IF p_before > now() THEN
    RAISE EXCEPTION 'Cutoff date cannot be in the future';
  END IF;

  DELETE FROM business_activity_logs
  WHERE business_account_id = p_business_account_id
    AND created_at < p_before;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  PERFORM log_business_activity(
    p_business_account_id    => p_business_account_id,
    p_action                 => 'activity.purged',
    p_category               => 'account',
    p_actor_type             => 'business_user',
    p_actor_name             => COALESCE(v_owner.full_name, v_owner.email),
    p_actor_auth_user_id     => v_owner.auth_user_id,
    p_actor_business_user_id => v_owner.id,
    p_actor_role             => v_owner.role,
    p_actor_email            => v_owner.email,
    p_severity               => 'critical',
    p_metadata               => jsonb_build_object(
      'rows_deleted', v_deleted,
      'cutoff', p_before
    )
  );

  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_business_activity(uuid, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_business_activity(uuid, timestamptz)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.purge_business_activity IS
  'Owner-triggered manual purge of activity older than a cutoff. Verifies the caller is '
  'an active owner of the account. Always leaves an activity.purged row recording the '
  'cutoff and the number of rows removed.';
