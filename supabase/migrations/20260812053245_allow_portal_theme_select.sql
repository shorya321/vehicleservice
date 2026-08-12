-- The admin/vendor portal theme lives in theme_settings under the fixed name
-- 'admin-vendor-portal' and is addressed by name, never by is_active.
--
-- The table's only broad read policy is "Everyone can view active theme"
-- (USING is_active = true), a leftover from a removed customer-site theming
-- layer whose engine (lib/theme/) no longer exists. The portal row is not the
-- active row, so only admins could read it: vendors and the anonymous
-- /admin/login screen hit PGRST116 and fell back to the hardcoded
-- DEFAULT_ADMIN_THEME in lib/admin/theme-utils.ts. The result was a vendor
-- portal that had never once been painted by the database.
--
-- is_active is deliberately NOT flipped. A partial unique index
-- (theme_settings_active_idx ON (is_active) WHERE is_active = true) permits one
-- active row and 'infinia-luxury' holds it, so flipping would raise a unique
-- violation and would also assert that the portal theme is the active customer
-- theme, which it is not.
--
-- No colour data is changed by this migration, so the admin panel renders
-- byte-identically; vendors and the login screen simply adopt the values admin
-- already used. The row's config is colour hex values only.
--
-- SELECT only. Writes stay gated by "Admins can manage themes" and by each
-- route's own profiles.role check.
--
-- Note: GET /api/admin/appearance has no role check of its own and relies on
-- RLS, so it now returns the portal theme to any caller. What that exposes is
-- the same hex values readable from the login page's computed CSS variables.
CREATE POLICY "Anyone can view the portal theme"
  ON public.theme_settings
  FOR SELECT
  USING (name = 'admin-vendor-portal');
