-- Mirror of the migration recorded server-side as
-- 20260822091126_revoke_public_execute_on_wallet_money_rpcs.
-- Applied via the Supabase MCP apply_migration tool. Do not `db push` this.
--
-- The three functions that actually move money are SECURITY DEFINER, accept an
-- arbitrary business_account_id and amount, and perform no authorization check
-- on the caller. add_to_wallet validates only the transaction type and that the
-- account exists; deduct_from_wallet has no caller-identity parameter at all,
-- so it cannot authorize - its frozen/limit/balance checks are about the target
-- account, not the caller.
--
-- All three were executable by anon and authenticated. Public-schema functions
-- are exposed at /rest/v1/rpc/<name> and NEXT_PUBLIC_SUPABASE_ANON_KEY ships in
-- the browser bundle, so any visitor could credit or drain any business wallet.
-- A signed-up business user knows their own business_account_id from their
-- session, so no guessing was required.
--
-- Every legitimate caller uses the service-role key, which keeps its explicit
-- grant and is unaffected:
--   app/api/business/bookings/route.ts:40-42        (service role client)
--   lib/business/quotations/convert-item.ts:69      (createAdminClient)
--   app/api/business/wallet/webhook/route.ts:203,331
--   app/api/business/wallet/verify-payment/route.ts:93
--   app/api/admin/businesses/[id]/credits/route.ts:70
--
-- Reversible: GRANT EXECUTE ... TO anon, authenticated restores the old state.

REVOKE EXECUTE ON FUNCTION public.add_to_wallet(uuid, numeric, text, text, text, uuid, text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.deduct_from_wallet(uuid, numeric, text, uuid, character varying)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking_with_wallet_deduction(
  uuid, uuid, text, text, text, uuid, uuid, text, text, timestamp with time zone,
  uuid, integer, numeric, numeric, text, text, text, bigint, text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
