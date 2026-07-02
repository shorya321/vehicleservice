-- =============================================================================
-- Wallet credit idempotency
-- =============================================================================
-- Closes the double-credit race in the business wallet:
--   * webhook (checkout.session.completed / payment_intent.succeeded) and
--   * client verify-payment
-- all credited via a check-then-act guard on wallet_transactions.stripe_payment_intent_id
-- with no DB-level uniqueness, so the same Stripe payment could credit twice.
--
-- This migration:
--   1. Guards against pre-existing duplicate stripe_payment_intent_id rows
--      (would otherwise make the unique index creation fail with a cryptic error).
--   2. Adds a partial UNIQUE index on wallet_transactions.stripe_payment_intent_id.
--   3. Rewrites add_to_wallet() to insert-first / credit-only-if-inserted, so a
--      duplicate payment intent becomes an idempotent no-op. Signature and return
--      type are unchanged, so no application caller changes.
--
-- Pre-check (run before applying, read-only):
--   SELECT stripe_payment_intent_id, count(*)
--   FROM wallet_transactions
--   WHERE stripe_payment_intent_id IS NOT NULL
--   GROUP BY stripe_payment_intent_id
--   HAVING count(*) > 1;
-- =============================================================================

-- 1. Fail loudly (with a helpful message) if duplicates already exist.
DO $$
DECLARE
  v_dupe_groups INTEGER;
BEGIN
  SELECT count(*) INTO v_dupe_groups FROM (
    SELECT stripe_payment_intent_id
    FROM wallet_transactions
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING count(*) > 1
  ) d;

  IF v_dupe_groups > 0 THEN
    RAISE EXCEPTION
      'Cannot add unique index: % duplicate stripe_payment_intent_id group(s) exist in wallet_transactions. Dedupe (keep earliest, reverse extra credits) before re-running.',
      v_dupe_groups;
  END IF;
END $$;

-- 2. Partial unique index — the DB-level idempotency gate.
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_tx_stripe_pi
  ON wallet_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 3. Idempotent add_to_wallet. Same signature/return as
--    20250103_create_business_functions.sql.
CREATE OR REPLACE FUNCTION add_to_wallet(
  p_business_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT,
  p_created_by TEXT DEFAULT 'system',
  p_reference_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current DECIMAL;
  v_new_balance DECIMAL;
  v_inserted INTEGER;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN ('credit_added', 'refund', 'admin_adjustment') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Lock the business account row; this also serializes concurrent credits
  -- for the same business (e.g. webhook vs client verify-payment).
  SELECT wallet_balance INTO v_current
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account not found: %', p_business_id;
  END IF;

  v_new_balance := v_current + p_amount;

  -- Insert the transaction FIRST. The partial unique index on
  -- stripe_payment_intent_id makes this the idempotency gate: a duplicate
  -- Stripe payment intent hits ON CONFLICT DO NOTHING and inserts nothing.
  -- A NULL payment intent (admin adjustment / refund) is never in the partial
  -- index, so it always inserts and always credits.
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by,
    stripe_payment_intent_id
  ) VALUES (
    p_business_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id,
    v_new_balance,
    p_created_by,
    p_stripe_payment_intent_id
  )
  ON CONFLICT (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL
  DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Duplicate payment intent: already processed. Do NOT credit again;
  -- return the current balance unchanged.
  IF v_inserted = 0 THEN
    RETURN v_current;
  END IF;

  -- A new transaction row was recorded — apply the balance change.
  UPDATE business_accounts
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_business_id;

  RETURN v_new_balance;
END;
$$;

COMMENT ON FUNCTION add_to_wallet IS
  'Atomically and idempotently adds amount to business wallet. Idempotent on stripe_payment_intent_id via the uq_wallet_tx_stripe_pi partial unique index. Used for recharge, refunds, and admin adjustments.';
