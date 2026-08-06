-- Business Activity Log - Step 8: backfill.
--
-- Without this the page ships empty for every existing tenant and reads as
-- broken on day one. Backfilled rows carry metadata.backfilled = true so nobody
-- later mistakes a reconstruction for a witnessed event, and actor_name falls
-- back to 'Unknown' where the actor cannot be recovered.
--
-- Runs last, after the UI renders, so a bad backfill is never the thing being
-- debugged. Reversible with:
--   DELETE FROM business_activity_logs WHERE metadata->>'backfilled' = 'true';
--
-- Every insert is guarded by NOT EXISTS, so this is idempotent and can never
-- duplicate a row that live capture already wrote. Verified by re-running: the
-- row count does not move.

-- Account creation: the day-zero anchor, so the timeline has a beginning and
-- the empty state is unreachable for a real account.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_name, action, category, severity,
  entity_type, entity_id, entity_label, metadata, created_at
)
SELECT
  ba.id, 'business_user', COALESCE(ba.contact_person_name, 'Unknown'),
  'account.registered', 'account', 'important',
  'account', ba.id, ba.business_name,
  jsonb_build_object('backfilled', true, 'business_name', ba.business_name,
                     'subdomain', ba.subdomain),
  ba.created_at
FROM business_accounts ba
WHERE NOT EXISTS (
  SELECT 1 FROM business_activity_logs l
  WHERE l.business_account_id = ba.id AND l.action = 'account.registered'
);

-- Bookings. The wallet deduction is deliberately NOT a separate row, matching
-- the live design where it is folded into booking.created.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_business_user_id, actor_name,
  action, category, severity, entity_type, entity_id, entity_label,
  amount, currency, metadata, created_at
)
SELECT
  bb.business_account_id, 'business_user', bb.created_by_user_id,
  COALESCE(bu.full_name, bu.email, 'Unknown'),
  'booking.created', 'booking', 'important',
  'business_booking', bb.id, bb.booking_number,
  bb.total_price, 'AED',
  jsonb_strip_nulls(jsonb_build_object(
    'backfilled', true,
    'pickup_at', bb.pickup_datetime,
    'pickup_clause', ' for ' || to_char(bb.pickup_datetime, 'DD Mon YYYY at HH24:MI'),
    'passenger_count', bb.passenger_count,
    'reference_number', bb.reference_number
  )),
  bb.created_at
FROM business_bookings bb
LEFT JOIN business_users bu ON bu.id = bb.created_by_user_id
WHERE NOT EXISTS (
  SELECT 1 FROM business_activity_logs l
  WHERE l.entity_id = bb.id AND l.action IN ('booking.created', 'booking.created_from_quotation')
);

-- Cancellations that already happened.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_name, action, category, severity,
  entity_type, entity_id, entity_label, amount, currency, metadata, created_at
)
SELECT
  bb.business_account_id, 'system', 'Unknown',
  'booking.cancelled', 'booking', 'important',
  'business_booking', bb.id, bb.booking_number,
  bb.wallet_deduction_amount, 'AED',
  jsonb_strip_nulls(jsonb_build_object(
    'backfilled', true,
    'reason_public', bb.cancellation_reason,
    'previous_status', 'confirmed'
  )),
  COALESCE(bb.cancelled_at, bb.updated_at)
FROM business_bookings bb
WHERE bb.booking_status = 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM business_activity_logs l
    WHERE l.entity_id = bb.id
      AND l.action IN ('booking.cancelled', 'booking.cancelled_by_admin')
  );

-- Quotations.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_business_user_id, actor_name,
  action, category, severity, entity_type, entity_id, entity_label,
  amount, currency, metadata, created_at
)
SELECT
  bq.business_account_id, 'business_user', bq.created_by_user_id,
  COALESCE(bu.full_name, bu.email, 'Unknown'),
  'quotation.created', 'quotation', 'info',
  'quotation', bq.id, bq.quotation_number,
  bq.total_sell_aed, 'AED',
  jsonb_strip_nulls(jsonb_build_object(
    'backfilled', true,
    'client_name', bq.customer_name,
    'client_clause', ' for ' || bq.customer_name
  )),
  bq.created_at
FROM business_quotations bq
LEFT JOIN business_users bu ON bu.id = bq.created_by_user_id
WHERE NOT EXISTS (
  SELECT 1 FROM business_activity_logs l
  WHERE l.entity_id = bq.id AND l.action = 'quotation.created'
);

-- Wallet credits, refunds and admin adjustments.
-- booking_deduction rows are skipped on purpose: that money movement is already
-- described by the booking.created row above.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_name, action, category, severity,
  entity_type, entity_id, amount, currency, metadata, created_at
)
SELECT
  wt.business_account_id,
  CASE WHEN wt.transaction_type = 'admin_adjustment' THEN 'admin' ELSE 'system' END,
  CASE
    WHEN wt.transaction_type = 'admin_adjustment' THEN 'Platform admin'
    WHEN wt.stripe_payment_intent_id IS NOT NULL THEN 'Stripe'
    ELSE 'System'
  END,
  CASE
    WHEN wt.transaction_type = 'refund' THEN 'wallet.refunded'
    WHEN wt.transaction_type = 'admin_adjustment' AND wt.amount >= 0 THEN 'wallet.credited_by_admin'
    WHEN wt.transaction_type = 'admin_adjustment' THEN 'wallet.debited_by_admin'
    ELSE 'wallet.topup_succeeded'
  END,
  'wallet',
  CASE WHEN wt.transaction_type = 'admin_adjustment' THEN 'critical' ELSE 'important' END,
  'wallet_transaction', wt.id,
  ABS(wt.amount), COALESCE(wt.currency, 'AED'),
  jsonb_strip_nulls(jsonb_build_object(
    'backfilled', true,
    'balance_after', wt.balance_after,
    'wallet_transaction_id', wt.id
  )),
  wt.created_at
FROM wallet_transactions wt
WHERE wt.transaction_type IN ('credit_added', 'refund', 'admin_adjustment')
  AND NOT EXISTS (
    SELECT 1 FROM business_activity_logs l
    WHERE l.metadata->>'wallet_transaction_id' = wt.id::text
  );

-- Reschedules.
INSERT INTO business_activity_logs (
  business_account_id, actor_type, actor_auth_user_id, actor_name,
  action, category, severity, entity_type, entity_id, entity_label,
  changes, metadata, created_at
)
SELECT
  bb.business_account_id, 'business_user', bdm.modified_by_user_id,
  COALESCE(bu.full_name, bu.email, 'Unknown'),
  'booking.datetime_changed', 'booking', 'important',
  'business_booking', bb.id, bb.booking_number,
  jsonb_build_object('pickup_datetime', jsonb_build_object(
    'from', bdm.previous_datetime, 'to', bdm.new_datetime)),
  jsonb_strip_nulls(jsonb_build_object(
    'backfilled', true,
    'previous_datetime', to_char(bdm.previous_datetime, 'DD Mon YYYY at HH24:MI'),
    'new_datetime', to_char(bdm.new_datetime, 'DD Mon YYYY at HH24:MI'),
    'reason_public', bdm.modification_reason,
    'modification_id', bdm.id
  )),
  bdm.created_at
FROM booking_datetime_modifications bdm
JOIN business_bookings bb ON bb.id = bdm.booking_id
LEFT JOIN business_users bu ON bu.auth_user_id = bdm.modified_by_user_id
WHERE NOT EXISTS (
  SELECT 1 FROM business_activity_logs l
  WHERE l.metadata->>'modification_id' = bdm.id::text
);

-- Resolve actor names the inserts above could not.
--
-- The inserts write straight to the table rather than through
-- log_business_activity, so they miss its business_users -> profiles fallback.
-- business_users.full_name and .email are null on accounts created before
-- 20260720_business_staff_users.sql, which would otherwise leave a feed full of
-- "Unknown created booking ..." for exactly the tenants that have the most
-- history. Rows whose actor is genuinely unknowable are left as 'Unknown'.
UPDATE business_activity_logs l
SET actor_name = COALESCE(
      NULLIF(btrim(COALESCE(bu.full_name, bu.email, '')), ''),
      NULLIF(btrim(COALESCE(p.full_name, p.email, '')), ''),
      'Unknown'
    ),
    actor_email = COALESCE(l.actor_email, bu.email, p.email),
    actor_auth_user_id = COALESCE(l.actor_auth_user_id, bu.auth_user_id)
FROM business_users bu
LEFT JOIN profiles p ON p.id = bu.auth_user_id
WHERE l.actor_business_user_id = bu.id
  AND l.actor_name = 'Unknown'
  AND l.metadata->>'backfilled' = 'true';
