-- Applied 2026-11-12 via Supabase MCP apply_migration (recorded version 20261112114720).
--
-- Any signed-in user could read every profile (email, phone, date of birth,
-- address, Stripe customer id, sign-in history) through the open policy below.
-- After this, a user reads only their own row ("Users can view own profile",
-- unchanged) and admins read all rows.
--
-- Checked before applying: all 87 policies on other tables that read profiles
-- filter on id = auth.uid() (own row); no SECURITY INVOKER function or view
-- reads profiles; app code reading other users' profiles uses the service role
-- or is admin-gated. The one exception, the reviewer embed on /vendor-application,
-- was removed in the same change. is_admin() is SECURITY DEFINER, so the new
-- policy does not recurse into profiles RLS.
-- Undo: UNDO_20261112114720_restrict_profiles_select_to_own_and_admin.sql.txt
DROP POLICY "Users can view any profile when authenticated" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
