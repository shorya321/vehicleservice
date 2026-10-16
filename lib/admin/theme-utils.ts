/**
 * Admin/Vendor Theme Utilities
 * Handles color conversions and type definitions
 * NOTE: Server-side database operations are in theme-server.ts
 */

// Theme configuration structure
export interface AdminThemeConfig {
  mode: 'dark' | 'light';
  accent: {
    primary: string;    // Hex color e.g., "#BA955E"
    secondary: string;  // Hex color e.g., "#14B8A6"
    tertiary: string;   // Hex color e.g., "#06B6D4"
  };
  dark: {
    background: string;
    surface: string;
    card: string;
    sidebar: string;
    muted: string;
    text_primary: string;
    text_secondary: string;
    border: string;
  };
  light: {
    background: string;
    surface: string;
    card: string;
    sidebar: string;
    muted: string;
    text_primary: string;
    text_secondary: string;
    border: string;
  };
}

// Default theme configuration
export const DEFAULT_ADMIN_THEME: AdminThemeConfig = {
  mode: 'dark',
  accent: {
    primary: '#BA955E',   // Gold
    secondary: '#14B8A6', // Teal
    tertiary: '#06B6D4',  // Cyan
  },
  dark: {
    background: '#09090B',
    surface: '#0F0F12',
    card: '#0e0e10',
    sidebar: '#0F0F12',
    muted: '#27272A',
    text_primary: '#FAFAFA',
    text_secondary: '#A1A1AA',
    border: '#323234',
  },
  light: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    sidebar: '#FFFFFF',
    muted: '#F4F4F5',
    text_primary: '#09090B',
    text_secondary: '#71717A',
    border: '#E4E4E7',
  },
};

/**
 * Convert hex color to HSL string for CSS variables
 * @param hex - Hex color string (e.g., "#BA955E")
 * @returns HSL string (e.g., "36 40% 55%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to CSS format (h s% l%)
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, '');
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12;
    return Math.round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return [channel(0), channel(8), channel(4)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function ratioOf(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** WCAG contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  return ratioOf(hexToRgb(foregroundHex), hexToRgb(backgroundHex));
}

/**
 * The accent as an HSL string, darkened only as far as it takes to read as
 * text on `backgroundHex`.
 *
 * The admin gold is picked to glow on charcoal. On the light theme's white it
 * sits near 2.8:1, so every gold label, link and outline button fades. Hue and
 * saturation are kept, so it still reads as the same gold.
 */
export function readableAccentHsl(accentHex: string, backgroundHex: string, minRatio = 4.5): string {
  const accentHsl = hexToHsl(accentHex);
  const background = hexToRgb(backgroundHex);
  if (ratioOf(hexToRgb(accentHex), background) >= minRatio) return accentHsl;

  const [h, s, l] = accentHsl.replace(/%/g, '').split(' ').map(Number);
  let lightness = l;
  while (lightness > 0 && ratioOf(hslToRgb(h, s, lightness), background) < minRatio) {
    lightness -= 1;
  }
  return `${h} ${s}% ${lightness}%`;
}

/**
 * Merge partial config with defaults
 */
export function mergeWithDefaults(config: Partial<AdminThemeConfig>): AdminThemeConfig {
  return {
    mode: config.mode || DEFAULT_ADMIN_THEME.mode,
    accent: {
      ...DEFAULT_ADMIN_THEME.accent,
      ...(config.accent || {}),
    },
    dark: {
      ...DEFAULT_ADMIN_THEME.dark,
      ...(config.dark || {}),
    },
    light: {
      ...DEFAULT_ADMIN_THEME.light,
      ...(config.light || {}),
    },
  };
}

/**
 * Generate CSS variables string from theme config
 * @param config - Theme configuration
 * @returns CSS variables as inline style string
 */
export function generateThemeCSSVariables(config: AdminThemeConfig): string {
  const mode = config.mode;
  const colors = mode === 'dark' ? config.dark : config.light;

  // Convert accent colors to HSL
  const primaryHsl = hexToHsl(config.accent.primary);

  // Convert surface colors to HSL
  const backgroundHsl = hexToHsl(colors.background);
  const cardHsl = hexToHsl(colors.card);
  const mutedHsl = hexToHsl(colors.muted);
  const textPrimaryHsl = hexToHsl(colors.text_primary);
  const textSecondaryHsl = hexToHsl(colors.text_secondary);
  const borderHsl = hexToHsl(colors.border);

  return `
    --background: ${backgroundHsl};
    --foreground: ${textPrimaryHsl};
    --card: ${cardHsl};
    --card-foreground: ${textPrimaryHsl};
    --popover: ${cardHsl};
    --popover-foreground: ${textPrimaryHsl};
    --primary: ${primaryHsl};
    --primary-foreground: ${mode === 'dark' ? '240 10% 4%' : '0 0% 100%'};
    --secondary: ${mutedHsl};
    --secondary-foreground: ${textPrimaryHsl};
    --muted: ${mutedHsl};
    --muted-foreground: ${textSecondaryHsl};
    --accent: ${primaryHsl};
    --accent-foreground: ${mode === 'dark' ? '240 10% 4%' : '240 10% 4%'};
    --border: ${borderHsl};
    --input: ${borderHsl};
    --ring: ${primaryHsl};
    --admin-primary: ${config.accent.primary};
    --admin-secondary: ${config.accent.secondary};
    --admin-tertiary: ${config.accent.tertiary};
    --admin-surface-0: ${colors.background};
    --admin-surface-1: ${colors.surface};
    --admin-surface-2: ${colors.card};
    --admin-text-primary: ${colors.text_primary};
    --admin-text-secondary: ${colors.text_secondary};
    --accent-gold: ${config.accent.primary};
    --accent-gold-light: ${config.accent.secondary};
  `.trim();
}
