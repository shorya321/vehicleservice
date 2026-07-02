-- =============================================================================
-- Remove the auto-recharge feature entirely
-- =============================================================================
-- Auto-recharge (off-session automatic wallet top-up) is removed. It was the
-- highest-risk surface (off-session card charging) and is superseded by manual
-- top-up. Drops all its DB objects. Safe: prod had 1 enabled setting and 0
-- attempts ever charged.
--
-- The AFTER INSERT trigger on wallet_transactions is dropped FIRST so normal
-- wallet credits/debits (add_to_wallet, deductions, bookings) are fully
-- decoupled before the tables/functions go.
-- =============================================================================

-- 1. Decouple the live wallet path first.
DROP TRIGGER IF EXISTS trigger_auto_recharge_check ON wallet_transactions;

-- 2. View depends on auto_recharge_attempts.
DROP VIEW IF EXISTS auto_recharge_monthly_spending;

-- 3. Tables (CASCADE removes their RLS policies, indexes, updated_at triggers).
DROP TABLE IF EXISTS auto_recharge_attempts CASCADE;
DROP TABLE IF EXISTS auto_recharge_settings CASCADE;

-- 4. Functions (unique names → args omitted; CASCADE for safety).
DROP FUNCTION IF EXISTS check_and_trigger_auto_recharge CASCADE;
DROP FUNCTION IF EXISTS update_auto_recharge_attempt_status CASCADE;
DROP FUNCTION IF EXISTS increment_auto_recharge_retry CASCADE;
DROP FUNCTION IF EXISTS check_monthly_auto_recharge_limit CASCADE;
DROP FUNCTION IF EXISTS generate_auto_recharge_idempotency_key CASCADE;
DROP FUNCTION IF EXISTS update_auto_recharge_settings_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_auto_recharge_attempts_updated_at CASCADE;

-- 5. Enum last (CASCADE catches any remaining enum-typed dependency).
DROP TYPE IF EXISTS auto_recharge_status CASCADE;
