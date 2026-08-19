/**
 * Business Portal Theme Variables
 *
 * The single source of truth for turning a tenant's ThemeConfig into CSS custom
 * properties. Two callers need the identical values:
 *
 *  - `app/business/(portal)/layout.tsx` serialises them into a <style> tag during
 *    SSR, so the very first paint is already the tenant's brand.
 *  - `lib/business/theme-provider.tsx` writes them as inline styles on <html>
 *    after mount, so preset switches and mode toggles apply without a reload.
 *
 * Inline styles outrank any stylesheet, so the two layers compose: the sheet
 * wins the first paint, the provider wins every update after it. Keeping the
 * derivation here rather than in the provider is what stops the two halves
 * drifting apart.
 *
 * SCOPE: Business module ONLY. Plain module, no "use client" - it has to be
 * importable from a Server Component.
 */

import {
  hexToHsl,
  hexToRgbTriplet,
  shiftHexLightness,
  getContrastColor,
  contrastRatio,
  isValidHexColor,
  DEFAULT_THEME_CONFIG,
  type ThemeConfig,
  type ThemeModeColors,
} from "@/lib/business/branding-utils";

export type ThemeMode = "dark" | "light";

/**
 * Every custom property name this module can emit.
 *
 * Exported so the provider's cleanup can remove exactly what it set without
 * repeating the list, and so adding a variable in one place cannot be forgotten
 * in the other.
 */
export const THEME_VAR_NAMES = [
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
  "--input",
  "--business-text-primary",
  "--business-text-secondary",
  "--business-primary",
  "--business-primary-500",
  "--business-primary-400",
  "--business-surface-0",
  "--business-surface-1",
  "--business-surface-2",
  "--business-surface-3",
  "--business-surface-4",
  "--business-text-muted",
  "--business-border-subtle",
  "--business-border-default",
  "--business-border-hover",
  "--business-border-active",
  "--business-sidebar",
  "--business-header",
  "--business-header-rgb",
  "--business-gradient-mesh",
] as const;

/**
 * Return `candidate` only if it is a well-formed hex colour, otherwise the
 * default.
 *
 * `theme_config` is a tenant-writable JSONB column and `parseThemeConfig` only
 * fills in *missing* keys - it never checks the format. Since these values are
 * about to be interpolated into a <style> tag, a value carrying `}` or a closing
 * style tag would escape the rule and inject arbitrary CSS. The API validates
 * hex on write, but rows predating that check, or edited directly in the
 * database, bypass it. Everything else this module emits is derived numerically
 * by hexToHsl / hexToRgbTriplet and is therefore safe by construction.
 */
function safeHex(candidate: string, fallback: string): string {
  return isValidHexColor(candidate) ? candidate : fallback;
}

/** Validate a whole mode palette against the matching default. */
function safeModeColors(
  colors: ThemeModeColors,
  fallback: ThemeModeColors
): ThemeModeColors {
  return {
    background: safeHex(colors.background, fallback.background),
    surface: safeHex(colors.surface, fallback.surface),
    card: safeHex(colors.card, fallback.card),
    sidebar: safeHex(colors.sidebar, fallback.sidebar),
    muted: safeHex(colors.muted, fallback.muted),
    text_primary: safeHex(colors.text_primary, fallback.text_primary),
    text_secondary: safeHex(colors.text_secondary, fallback.text_secondary),
    border: safeHex(colors.border, fallback.border),
  };
}

/**
 * Contrast floor for muted text against its own mode's background.
 *
 * WCAG AA for body text. app/business/globals.css used to guarantee legibility
 * here with a hardcoded `.light label.text-muted-foreground { ... !important }`,
 * which no tenant value could ever beat. Deriving the colour instead only works
 * if the derivation cannot fade itself into the background.
 */
const MIN_MUTED_CONTRAST = 4.5;

/**
 * Fade `color` toward the mode's background without dropping below
 * MIN_MUTED_CONTRAST.
 *
 * Tries the full fade first and backs off in even steps, so a palette with room
 * to spare gets the intended separation between secondary and muted text, and a
 * tight one degrades to no fade at all rather than to something unreadable.
 *
 * The fallback is the unfaded colour - that is `text_secondary`, which the
 * tenant already chose as readable body text. If even that fails the floor the
 * palette itself is the problem, and inventing a different colour here would
 * silently override a deliberate choice.
 * @param color Hex colour to fade, normally text_secondary
 * @param background Hex background the result must stay legible against
 * @param amount Full fade ratio, signed as shiftHexLightness expects
 * @returns Hex colour
 */
function fadeWithContrastFloor(
  color: string,
  background: string,
  amount: number
): string {
  const steps = 6;

  for (let step = steps; step >= 1; step--) {
    const candidate = shiftHexLightness(color, (amount * step) / steps);
    if (contrastRatio(candidate, background) >= MIN_MUTED_CONTRAST) {
      return candidate;
    }
  }

  return color;
}

/**
 * Build every CSS custom property the business portal theme controls, for one
 * mode.
 * @param config Tenant theme configuration (already run through parseThemeConfig)
 * @param mode Which palette to resolve - "dark" or "light"
 * @returns Property name -> value, ready for setProperty or serialisation
 */
export function buildThemeVars(
  config: ThemeConfig,
  mode: ThemeMode
): Record<string, string> {
  const isDark = mode === "dark";

  const primary = safeHex(config.accent.primary, DEFAULT_THEME_CONFIG.accent.primary);
  const secondary = safeHex(
    config.accent.secondary,
    DEFAULT_THEME_CONFIG.accent.secondary
  );

  const modeColors = safeModeColors(
    isDark ? config.dark : config.light,
    isDark ? DEFAULT_THEME_CONFIG.dark : DEFAULT_THEME_CONFIG.light
  );

  const primaryRgb = hexToRgbTriplet(primary);
  const secondaryRgb = hexToRgbTriplet(secondary);

  return {
    "--primary": hexToHsl(primary),
    // Label colour on top of the accent is derived from the accent's own
    // luminance, not from the light/dark mode. Pinning it to near-black in dark
    // and white in light gave white-on-amber and near-black-on-indigo, because
    // the mode says nothing about how bright the tenant picked their accent.
    "--primary-foreground": hexToHsl(getContrastColor(primary)),
    "--secondary": hexToHsl(secondary),
    "--secondary-foreground": "0 0% 100%",
    "--accent": isDark ? hexToHsl(modeColors.muted) : hexToHsl(modeColors.surface),
    "--accent-foreground": hexToHsl(modeColors.text_primary),
    "--ring": hexToHsl(primary),

    "--background": hexToHsl(modeColors.background),
    "--foreground": hexToHsl(modeColors.text_primary),
    "--card": hexToHsl(modeColors.card),
    "--card-foreground": hexToHsl(modeColors.text_primary),
    "--popover": hexToHsl(modeColors.surface),
    "--popover-foreground": hexToHsl(modeColors.text_primary),
    "--muted": hexToHsl(modeColors.muted),
    "--muted-foreground": hexToHsl(modeColors.text_secondary),
    "--border": hexToHsl(modeColors.border),
    "--input": hexToHsl(modeColors.border),

    // Business-specific variables. These stay raw hex because they are read as
    // var(--business-*) with no hsl() wrapper.
    "--business-text-primary": modeColors.text_primary,
    "--business-text-secondary": modeColors.text_secondary,

    // Accent ramp. Components reference the 400 and 500 steps for checked
    // states, focus rings, menu highlights and table hover accents.
    "--business-primary": primary,
    "--business-primary-500": primary,
    "--business-primary-400": shiftHexLightness(primary, 0.12),

    // Muted text. Faded off text_secondary rather than exposed as its own
    // picker, with a hard contrast floor - see fadeWithContrastFloor.
    "--business-text-muted": fadeWithContrastFloor(
      modeColors.text_secondary,
      modeColors.background,
      isDark ? -0.25 : 0.18
    ),

    // Surface layers behind the portal chrome.
    "--business-surface-0": modeColors.background,
    "--business-surface-1": modeColors.sidebar,
    "--business-surface-2": modeColors.card,
    // Hover and elevated steps, derived off the card so they track the tenant
    // instead of the zinc ramp hardcoded in app/business/globals.css.
    "--business-surface-3": shiftHexLightness(modeColors.card, isDark ? 0.06 : -0.06),
    "--business-surface-4": shiftHexLightness(modeColors.card, isDark ? 0.12 : -0.12),

    // Border ramp. The tenant picks one border colour; the subtle/hover/active
    // steps move away from it in the direction the mode has room for. These were
    // fixed rgba(255,255,255,...) / rgba(0,0,0,...) values before, which is why
    // changing "Border" appeared to do nothing outside of inputs and tables.
    "--business-border-subtle": shiftHexLightness(modeColors.border, isDark ? -0.18 : 0.18),
    "--business-border-default": modeColors.border,
    "--business-border-hover": shiftHexLightness(modeColors.border, isDark ? 0.12 : -0.12),
    "--business-border-active": shiftHexLightness(modeColors.border, isDark ? 0.24 : -0.24),

    // Portal chrome. Kept as their own variables rather than reusing
    // --business-surface-1 / --popover so the sidebar and header read as what
    // the branding form calls them, and so the Live Preview and the real portal
    // paint from the same two values.
    "--business-sidebar": modeColors.sidebar,
    "--business-header": modeColors.surface,
    // Triplet form, because .business-chrome-header needs the header colour at
    // 95% alpha and rgba() cannot take a hex var.
    "--business-header-rgb": hexToRgbTriplet(modeColors.surface),

    // Mesh backdrop painted by .business-mesh-bg.
    "--business-gradient-mesh": [
      `radial-gradient(at 40% 20%, rgba(${primaryRgb}, 0.08) 0px, transparent 50%)`,
      `radial-gradient(at 80% 0%, rgba(${secondaryRgb}, 0.06) 0px, transparent 50%)`,
      `radial-gradient(at 0% 50%, rgba(${primaryRgb}, 0.06) 0px, transparent 50%)`,
    ].join(", "),
  };
}

/** Serialise a variable map into a declaration block body. */
function declarations(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
}

/**
 * Render both palettes as a stylesheet for the portal layout to inline.
 *
 * Two deliberate choices in the selectors:
 *
 * 1. Scoped to `[data-business-branding]`, not bare `:root`. The attribute is set
 *    by THEME_MODE_BOOTSTRAP before paint and removed by the provider's cleanup,
 *    so these rules are inert on any non-business page - the sheet cannot leak
 *    into the admin, vendor or customer surfaces even if the tag outlived the
 *    layout.
 * 2. Specificity beats source order. `:root[data-business-branding]` is (0,2,1)
 *    and the `.light` variant (0,3,1), against (0,1,0) for the `:root` and
 *    `.light` blocks in app/business/globals.css. So the tenant palette wins
 *    wherever this tag lands, rather than the fix being hostage to stylesheet
 *    ordering.
 *
 * The server cannot know which mode will resolve (it lives in localStorage), so
 * both are emitted and the class on <html> selects between them.
 * @param config Tenant theme configuration
 * @returns CSS text, safe to inline
 */
export function buildThemeStyleSheet(config: ThemeConfig): string {
  const dark = declarations(buildThemeVars(config, "dark"));
  const light = declarations(buildThemeVars(config, "light"));

  return (
    `:root[data-business-branding]{${dark}}` +
    `:root[data-business-branding].light{${light}}`
  );
}

/**
 * Global where the bootstrap parks its guard so the provider can take over.
 * @see THEME_MODE_BOOTSTRAP
 */
export const THEME_GUARD_GLOBAL = "__businessThemeGuard";

/**
 * Blocking script that settles the dark/light class before the first paint, then
 * holds it until React takes over.
 *
 * Needed because the mode lives in localStorage, so the server cannot render the
 * right class, and because next-themes (root layout, defaultTheme="system"
 * enableSystem) otherwise applies the *system* preference - a white page for
 * anyone on a light-preference machine.
 *
 * The observer is the important half. next-themes re-asserts the system
 * preference **when it hydrates**, which measured ~750ms after first paint and
 * therefore long before BusinessThemeProvider's effects exist to defend against
 * it. A guard installed by the provider is necessarily too late; this one is
 * running from the first script tag, so it corrects at the microtask boundary
 * before anything is painted.
 *
 * It re-reads localStorage on every mutation rather than closing over the mode
 * read at load, so a genuine theme toggle is honoured - `setTheme` writes storage
 * before the class changes, so the guard always agrees with the user's choice
 * rather than reverting it.
 *
 * The provider disconnects this via `window[THEME_GUARD_GLOBAL]` once mounted and
 * installs its own, which is tied to the portal's lifetime. That handoff matters:
 * left running, this would keep forcing the portal's mode after a client-side
 * navigation out of the business module.
 *
 * Resolution order mirrors BusinessThemeProvider exactly - a stored light/dark
 * wins, "system" consults the media query, anything else (including a first
 * visit) falls back to dark, the portal layout's defaultTheme - so the pre-paint
 * state and the post-mount state can never disagree.
 */
export const THEME_MODE_BOOTSTRAP = `(function(){function d(){try{var s=localStorage.getItem('business-theme');if(s==='light'||s==='dark')return s;if(s==='system')return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';return 'dark';}catch(e){return 'dark';}}function a(){var m=d(),r=document.documentElement;if(!r.classList.contains(m)){r.classList.remove('light','dark');r.classList.add(m);}if(r.getAttribute('data-business-theme')!==m)r.setAttribute('data-business-theme',m);if(r.getAttribute('data-business-branding')!=='true')r.setAttribute('data-business-branding','true');}try{a();var o=new MutationObserver(a);o.observe(document.documentElement,{attributes:true,attributeFilter:['class']});window['${THEME_GUARD_GLOBAL}']=o;}catch(e){document.documentElement.classList.add('dark');}})();`;
