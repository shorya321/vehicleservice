-- Mirror of the migration recorded server-side as
-- 20260822094027_revoke_public_execute_on_dead_admin_wallet_rpcs.
-- Applied via the Supabase MCP apply_migration tool. Do not `db push` this.
--
-- The admin wallet management page was deleted, so these five have no caller
-- left anywhere in the codebase.
--
-- Four of them are also a trap. They are SECURITY DEFINER and authorize on a
-- caller-supplied p_admin_user_id rather than auth.uid():
--
--   IF NOT EXISTS (SELECT 1 FROM profiles
--                  WHERE auth_user_id = p_admin_user_id AND user_role = 'admin')
--   THEN RAISE EXCEPTION 'User is not authorized to perform this action';
--
-- profiles has id and role, not auth_user_id and user_role, so that statement
-- raises and every call has always failed - which is the only reason the design
-- flaw was never exploitable. The obvious-looking repair, swapping the column
-- names, would arm anonymous wallet manipulation: authorization would then pass
-- for anyone who supplies a known admin uuid.
--
-- Revoking rather than dropping: it closes the exposure, is one GRANT to undo,
-- and keeps the definitions available if a properly-authorized version (gating
-- on auth.uid()) is wanted later.
--
-- Reversible: GRANT EXECUTE ... TO anon, authenticated restores the old state.

REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, uuid, numeric, text, character varying)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.freeze_business_wallet(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.unfreeze_business_wallet(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_spending_limits(uuid, uuid, numeric, numeric, numeric, boolean, text)
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_audit_log(
  uuid, uuid, timestamp with time zone, timestamp with time zone, text[], integer, integer)
  FROM PUBLIC, anon, authenticated;
