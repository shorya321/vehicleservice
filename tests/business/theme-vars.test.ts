/**
 * Guards the business portal's theme chokepoint.
 *
 * `lib/business/theme-vars.ts` is the only place a tenant's `theme_config`
 * becomes CSS. Two callers depend on it agreeing with itself - the portal layout
 * serialises it into an SSR <style> tag, the provider writes it as inline styles
 * after mount - and the whole portal depends on it covering every variable the
 * chrome actually reads.
 *
 * It did not. `--business-text-muted`, the border ramp and the hover surfaces
 * were consumed in ~60 places but never emitted, so they stayed on the hardcoded
 * gold/zinc values in app/business/globals.css for every tenant. Editing the
 * dark or light palette appeared to do nothing while the branding Live Preview
 * showed it working. The chokepoint test below is what stops that returning: add
 * a mode-dependent variable to globals.css, forget to emit it, and this fails.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import {
  buildThemeVars,
  buildThemeStyleSheet,
  THEME_VAR_NAMES,
  type ThemeMode,
} from '@/lib/business/theme-vars';
import {
  DEFAULT_THEME_CONFIG,
  FULL_COLOR_PRESETS,
  contrastRatio,
  parseThemeConfig,
  type ThemeConfig,
} from '@/lib/business/branding-utils';

const MODES: ThemeMode[] = ['dark', 'light'];

/** WCAG AA for body text. Muted text must clear this against its background. */
const MIN_MUTED_CONTRAST = 4.5;

/**
 * Variables whose correct value depends on which mode is showing.
 *
 * The complement - radii, durations, easings, z-indices, fonts, spacing, the
 * payment brand colours and the semantic success/warning/error set - is
 * deliberately mode-independent and stays in globals.css.
 */
const MODE_DEPENDENT_PREFIXES = [
  '--business-surface-',
  '--business-text-',
  '--business-border-',
  '--business-sidebar',
  '--business-header',
  '--business-primary',
];

/** Mode-independent names that share a prefix with the list above. */
const MODE_INDEPENDENT_EXCEPTIONS = new Set([
  // Light-mode source values that the .light block in globals.css maps onto the
  // generic names. They are the unbranded fallback for the auth pages, which sit
  // outside (portal) and so never get a provider.
  '--business-surface-light-0',
  '--business-surface-light-1',
  '--business-surface-light-2',
  '--business-surface-light-3',
  '--business-surface-light-4',
  '--business-text-light-primary',
  '--business-text-light-secondary',
  '--business-text-light-muted',
  // Gradients and glass effects, composed from the accent rather than the mode.
  '--business-header-gradient',
  '--business-sidebar-gradient',
]);

const SOURCE_ROOTS = ['app/business', 'components/business'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css'];

function collectFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectFiles(path, found);
    } else if (SOURCE_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      found.push(path);
    }
  }
  return found;
}

interface VarReference {
  name: string;
  file: string;
}

/**
 * Every `var(--business-…)` name referenced anywhere in the portal, with the
 * first file that reads it.
 *
 * Deliberately an exec loop over a plain array rather than `matchAll` into a
 * Map. tsconfig targets ES5 without downlevelIteration, so ts-jest compiles a
 * spread of an iterator - and a for..of over a Map - into a length-indexed loop
 * that silently yields nothing. The first draft of this test used matchAll and
 * passed while finding zero variables, which is the exact failure mode it is
 * supposed to catch.
 */
function referencedBusinessVars(): VarReference[] {
  const references: VarReference[] = [];
  const seen: Record<string, true> = {};
  const pattern = /var\((--business-[a-z0-9-]+)\)/g;

  for (const root of SOURCE_ROOTS) {
    const files = collectFiles(root);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      pattern.lastIndex = 0;

      let match = pattern.exec(source);
      while (match !== null) {
        const name = match[1];
        if (!seen[name]) {
          seen[name] = true;
          references.push({ name, file });
        }
        match = pattern.exec(source);
      }
    }
  }

  return references;
}

describe('buildThemeVars', () => {
  it.each(MODES)('emits every declared name in %s mode', (mode) => {
    const vars = buildThemeVars(DEFAULT_THEME_CONFIG, mode);

    for (const name of THEME_VAR_NAMES) {
      expect(vars[name]).toBeDefined();
      expect(vars[name]).not.toBe('');
    }
  });

  it.each(MODES)('emits nothing undeclared in %s mode', (mode) => {
    const declared = new Set<string>(THEME_VAR_NAMES);

    // The provider's cleanup removes exactly THEME_VAR_NAMES. Anything emitted
    // but not declared would be left behind on <html> after navigating out of
    // the portal, leaking a tenant's palette onto the admin or customer surface.
    for (const name of Object.keys(buildThemeVars(DEFAULT_THEME_CONFIG, mode))) {
      expect(declared.has(name)).toBe(true);
    }
  });

  it('resolves the chrome from sidebar and surface, not card', () => {
    const config: ThemeConfig = {
      ...DEFAULT_THEME_CONFIG,
      dark: {
        ...DEFAULT_THEME_CONFIG.dark,
        card: '#111111',
        sidebar: '#222222',
        surface: '#333333',
      },
    };
    const vars = buildThemeVars(config, 'dark');

    expect(vars['--business-sidebar']).toBe('#222222');
    expect(vars['--business-header']).toBe('#333333');
    expect(vars['--business-header-rgb']).toBe('51, 51, 51');
  });

  it('tracks the tenant border across the whole ramp', () => {
    const config: ThemeConfig = {
      ...DEFAULT_THEME_CONFIG,
      dark: { ...DEFAULT_THEME_CONFIG.dark, border: '#F97316' },
    };
    const vars = buildThemeVars(config, 'dark');

    expect(vars['--business-border-default']).toBe('#F97316');
    for (const name of [
      '--business-border-subtle',
      '--business-border-hover',
      '--business-border-active',
    ]) {
      // Derived, so not equal to the picked colour, but no longer the fixed
      // rgba(255,255,255,…) that ignored theme_config entirely.
      expect(vars[name]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(vars[name]).not.toBe(vars['--business-border-default']);
    }
  });

  it('separates the two modes', () => {
    const dark = buildThemeVars(DEFAULT_THEME_CONFIG, 'dark');
    const light = buildThemeVars(DEFAULT_THEME_CONFIG, 'light');

    for (const name of [
      '--background',
      '--business-sidebar',
      '--business-header',
      '--business-text-muted',
      '--business-border-default',
      '--business-surface-3',
    ]) {
      expect(dark[name]).not.toBe(light[name]);
    }
  });

  it('falls back to the default palette on a malformed hex', () => {
    // theme_config is tenant-writable JSONB and parseThemeConfig only fills in
    // missing keys, so a value carrying `}` would escape the <style> rule.
    const hostile = parseThemeConfig({
      dark: { background: '}</style><script>alert(1)</script>' },
    });
    const vars = buildThemeVars(hostile, 'dark');
    const sheet = buildThemeStyleSheet(hostile);

    expect(vars['--background']).toBe(
      buildThemeVars(DEFAULT_THEME_CONFIG, 'dark')['--background']
    );
    expect(sheet).not.toContain('<script>');
    expect(sheet).not.toContain('</style>');
  });
});

describe('muted text contrast floor', () => {
  // globals.css used to guarantee this with `.light label.text-muted-foreground
  // { color: hsl(240 6% 30%) !important }`, which no tenant value could beat.
  // Deriving the colour is only safe while this holds.
  const palettes: Array<[string, ThemeConfig]> = [
    ['default', DEFAULT_THEME_CONFIG],
    ...FULL_COLOR_PRESETS.map(
      (preset): [string, ThemeConfig] => [
        preset.name,
        {
          accent: preset.accent,
          dark: preset.dark,
          light: preset.light,
          _version: 1,
        },
      ]
    ),
  ];

  it.each(palettes.flatMap(([name, config]) =>
    MODES.map((mode): [string, ThemeMode, ThemeConfig] => [name, mode, config])
  ))('holds AA for %s in %s mode', (_name, mode, config) => {
    const vars = buildThemeVars(config, mode);
    const background = mode === 'dark' ? config.dark.background : config.light.background;

    expect(
      contrastRatio(vars['--business-text-muted'], background)
    ).toBeGreaterThanOrEqual(MIN_MUTED_CONTRAST);
  });
});

describe('theme variable chokepoint', () => {
  it('emits every mode-dependent variable the portal reads', () => {
    const declared = new Set<string>(THEME_VAR_NAMES);
    const missing: string[] = [];

    const references = referencedBusinessVars();

    // Guard the guard: if the scan finds nothing, every assertion below is
    // vacuous and the test would pass through any regression at all.
    expect(references.length).toBeGreaterThan(20);

    for (const { name, file } of references) {
      if (MODE_INDEPENDENT_EXCEPTIONS.has(name)) continue;
      if (!MODE_DEPENDENT_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
      if (declared.has(name)) continue;

      missing.push(`${name} (first read in ${file})`);
    }

    expect(missing).toEqual([]);
  });
});
