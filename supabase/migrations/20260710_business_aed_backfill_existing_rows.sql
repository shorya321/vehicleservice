-- Backfill existing business rows to AED.
--
-- Runs after 20260710_business_aed_default_currency.sql, which fixed the column defaults
-- and the two business wallet functions. This migration relabels the rows that were
-- written while those defaults still said 'USD'.
--
-- Business wallet balances and booking prices are AED-denominated; the 'USD' label was
-- never accompanied by any conversion.
--
-- NOTE: the "Wallet recharge via Payment Element" credits were genuinely charged in USD by
-- the old create-intent / charge-saved routes, which read preferred_currency as the Stripe
-- charge currency. Those routes now hardcode 'aed'. The affected rows are test records and
-- were relabelled with the account owner's explicit confirmation.
--
-- SCOPE: business tables only. admin_wallet_audit_log, bookings and zone_pricing are
-- deliberately left alone.

UPDATE business_accounts
SET currency = 'AED', preferred_currency = 'AED'
WHERE currency <> 'AED' OR preferred_currency IS DISTINCT FROM 'AED';

UPDATE wallet_transactions
SET currency = 'AED'
WHERE currency = 'USD';
