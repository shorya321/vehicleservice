-- Remove the orphaned customer-site theme rows and the dead is_active policy.
--
-- theme_settings has been doing two unrelated jobs. It began (Oct 2025) as a
-- swappable design system for the public site: several presets, exactly one
-- active, selected by is_active and enforced by
-- theme_settings_active_idx ON (is_active) WHERE is_active = true. The engine
-- that consumed it, lib/theme/, has since been deleted: the directory is gone,
-- nothing imports @/lib/theme, no code references these theme names, the
-- /admin/theme-settings gallery route no longer exists, and the public site is
-- styled by the static app/globals.css.
--
-- The only row any running code reads is 'admin-vendor-portal' (added Jan 2026,
-- a completely different config shape), and every query against this table
-- filters .eq('name', 'admin-vendor-portal'). So the three rows below are
-- migration residue.
--
-- Checked before writing this: no inbound foreign keys, no dependent views, no
-- tests, and nothing under supabase/ reads them apart from the Oct 2025 seed
-- migrations and an updated_at trigger.
--
-- REVERSIBLE WITHOUT A DATABASE BACKUP. The exact config of all three rows as
-- they existed at deletion time is reproduced at the bottom of this file. Note
-- that 'Aurora Pro' and 'Obsidian Elite' were last updated 2025-10-15, after
-- their seed migrations ran, so the seed files are NOT a faithful copy - use
-- the block below instead. 'infinia-luxury' was created out-of-band and appears
-- in no migration at all, so this file is its only record.

DELETE FROM public.theme_settings
WHERE name IN ('infinia-luxury', 'Aurora Pro', 'Obsidian Elite');

-- With those rows gone this policy matches nothing. It is also the exact
-- coupling that caused the portal-theme bug: is_active stopped driving
-- rendering when lib/theme/ was deleted, but never stopped driving permissions,
-- so a flag with no remaining purpose was deciding who could read the portal
-- theme. Reading is now handled by "Anyone can view the portal theme"
-- (20260812053245), which keys off name. Leaving this one in place would keep
-- the trap armed for whoever next sets is_active on a row.
DROP POLICY "Everyone can view active theme" ON public.theme_settings;

-- End state: one row ('admin-vendor-portal') and two policies
-- ("Admins can manage themes" ALL, "Anyone can view the portal theme" SELECT).
--
-- The is_active column and theme_settings_active_idx are deliberately kept:
-- dropping the column would mean hand-editing lib/supabase/types.ts and would
-- foreclose reviving customer-site theming without another migration.

-- ---------------------------------------------------------------------------
-- RESTORE (uncomment and run to undo this migration)
-- ---------------------------------------------------------------------------
-- CREATE POLICY "Everyone can view active theme"
--   ON public.theme_settings FOR SELECT USING (is_active = true);
--
-- INSERT INTO public.theme_settings (name, is_active, config) VALUES
--   ('infinia-luxury', true, '{"colors": {"luxury": {"gold": "#c6aa88", "gray": "#2C2C2C", "black": "#0A0A0A", "pearl": "#F5F5F5", "darkGray": "#181818", "goldLight": "#E8D9C5", "lightGray": "#B0B0B0"}}, "shadows": {"card": "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)", "gold": "0 10px 20px -5px rgba(198, 170, 136, 0.15), 0 4px 8px -4px rgba(198, 170, 136, 0.1)", "cardHover": "0 25px 50px -12px rgba(0, 0, 0, 0.3)"}, "spacing": {"section": {"lg": "7rem", "md": "5rem", "sm": "3rem"}, "container": {"lg": "2rem", "md": "1.5rem", "sm": "1rem"}}, "animations": {"easing": {"in": "ease-in", "out": "ease-out", "default": "ease-in-out"}, "duration": {"fast": "150ms", "slow": "500ms", "normal": "300ms"}}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem", "base": "1rem"}, "fontFamily": {"mono": "JetBrains Mono", "sans": "Montserrat", "serif": "Playfair Display"}, "fontWeight": {"bold": "700", "medium": "500", "normal": "400", "semibold": "600"}, "lineHeight": {"tight": "1.25", "normal": "1.5", "relaxed": "1.75"}, "letterSpacing": {"wide": "0.05em", "tight": "-0.025em", "wider": "0.1em", "normal": "0"}}, "borderRadius": {"lg": "0.75rem", "md": "0.5rem", "sm": "0.25rem", "xl": "1rem", "full": "9999px"}}'::jsonb),
--   ('Aurora Pro', false, '{"colors": {"luxury": {"gold": "#6366F1", "gray": "#27272A", "black": "#0A0A0B", "pearl": "#FAFAFA", "darkGray": "#18181B", "goldLight": "#818CF8", "lightGray": "#A1A1AA"}}, "shadows": {"lg": "0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -4px rgba(99, 102, 241, 0.1)", "sm": "0 1px 3px 0 rgba(99, 102, 241, 0.1), 0 1px 2px -1px rgba(99, 102, 241, 0.1)", "xl": "0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1)", "xs": "0 1px 2px 0 rgba(99, 102, 241, 0.05)", "2xl": "0 25px 50px -12px rgba(99, 102, 241, 0.25)", "card": "0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -2px rgba(99, 102, 241, 0.1)", "gold": "0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(129, 140, 248, 0.2)", "cardHover": "0 20px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(99, 102, 241, 0.1)"}, "spacing": {"section": {"lg": "6rem", "md": "4rem", "sm": "2rem", "xl": "8rem"}, "container": {"lg": "2rem", "md": "1.5rem", "sm": "1rem", "xl": "3rem"}}, "animations": {"easing": {"in": "cubic-bezier(0.4, 0, 1, 1)", "out": "cubic-bezier(0, 0, 0.2, 1)", "inOut": "cubic-bezier(0.4, 0, 0.2, 1)", "default": "cubic-bezier(0.4, 0, 0.2, 1)"}, "duration": {"fast": "100ms", "slow": "300ms", "normal": "200ms", "slower": "500ms"}}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem", "7xl": "4.5rem", "8xl": "6rem", "9xl": "8rem", "base": "1rem"}, "fontFamily": {"mono": "Geist Mono", "sans": "Geist", "serif": "Fraunces"}, "fontWeight": {"bold": "700", "thin": "100", "black": "900", "light": "300", "medium": "500", "normal": "400", "semibold": "600", "extrabold": "800", "extralight": "200"}, "lineHeight": {"none": "1", "snug": "1.375", "loose": "2", "tight": "1.25", "normal": "1.5", "relaxed": "1.625"}, "letterSpacing": {"wide": "0.025em", "tight": "-0.025em", "wider": "0.05em", "normal": "0", "widest": "0.1em", "tighter": "-0.05em"}}, "borderRadius": {"lg": "1rem", "md": "0.75rem", "sm": "0.375rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px", "none": "0"}}'::jsonb),
--   ('Obsidian Elite', false, '{"colors": {"luxury": {"gold": "#10B981", "gray": "#1A1B1C", "black": "#000000", "pearl": "#FFFFFF", "darkGray": "#0F1011", "goldLight": "#34D399", "lightGray": "#9CA3AF"}}, "shadows": {"lg": "0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -4px rgba(16, 185, 129, 0.1)", "sm": "0 1px 3px 0 rgba(16, 185, 129, 0.08), 0 1px 2px -1px rgba(16, 185, 129, 0.08)", "xl": "0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.1)", "xs": "0 1px 2px 0 rgba(16, 185, 129, 0.05)", "2xl": "0 25px 50px -12px rgba(16, 185, 129, 0.2)", "card": "0 4px 6px -1px rgba(16, 185, 129, 0.08), 0 2px 4px -2px rgba(16, 185, 129, 0.08)", "gold": "0 0 20px rgba(16, 185, 129, 0.2), 0 0 40px rgba(52, 211, 153, 0.15)", "cardHover": "0 20px 25px -5px rgba(16, 185, 129, 0.12), 0 8px 10px -6px rgba(16, 185, 129, 0.1)"}, "spacing": {"section": {"lg": "6rem", "md": "4rem", "sm": "2rem", "xl": "8rem"}, "container": {"lg": "2rem", "md": "1.5rem", "sm": "1rem", "xl": "3rem"}}, "animations": {"easing": {"in": "cubic-bezier(0.4, 0, 1, 1)", "out": "cubic-bezier(0, 0, 0.2, 1)", "inOut": "cubic-bezier(0.4, 0, 0.2, 1)", "default": "cubic-bezier(0.4, 0, 0.2, 1)"}, "duration": {"fast": "100ms", "slow": "300ms", "normal": "200ms", "slower": "500ms"}}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem", "7xl": "4.5rem", "8xl": "6rem", "9xl": "8rem", "base": "1rem"}, "fontFamily": {"mono": "JetBrains Mono", "sans": "Inter", "serif": "DM Serif Display"}, "fontWeight": {"bold": "700", "thin": "100", "black": "900", "light": "300", "medium": "500", "normal": "400", "semibold": "600", "extrabold": "800", "extralight": "200"}, "lineHeight": {"none": "1", "snug": "1.375", "loose": "2", "tight": "1.25", "normal": "1.5", "relaxed": "1.625"}, "letterSpacing": {"wide": "0.025em", "tight": "-0.025em", "wider": "0.05em", "normal": "0", "widest": "0.1em", "tighter": "-0.05em"}}, "borderRadius": {"lg": "1.125rem", "md": "0.75rem", "sm": "0.5rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px", "none": "0"}}'::jsonb);
