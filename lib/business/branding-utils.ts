/**
 * Branding Utilities
 * Helper functions for white-label branding operations
 */

// ============================================================================
// Theme Config Types (JSONB Structure)
// ============================================================================

/**
 * Colors for a single theme mode (dark or light)
 */
export interface ThemeModeColors {
  background: string;
  surface: string;
  card: string;
  sidebar: string;
  muted: string;
  text_primary: string;
  text_secondary: string;
  border: string;
}

/**
 * Accent colors (shared across dark/light modes)
 */
export interface ThemeAccentColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

/**
 * Complete theme configuration stored in theme_config JSONB column
 */
export interface ThemeConfig {
  accent: ThemeAccentColors;
  dark: ThemeModeColors;
  light: ThemeModeColors;
  _version?: number;
}

/**
 * Default theme configuration - Gold Luxury theme
 * This is the canonical source of default colors
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  accent: {
    primary: '#C6AA88',   // Gold - primary accent
    secondary: '#14B8A6', // Teal - secondary accent
    tertiary: '#06B6D4',  // Cyan - tertiary accent
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
  _version: 1,
};

/**
 * Business portal theme colors - Gold design system
 * Used as reference for business CSS variables (app/business/globals.css)
 */
export const BUSINESS_THEME = {
  background: '#09090B', // business-surface-0
  surface: '#18181B', // business-surface-2
  border: '#27272A', // business-border
  accent: '#C6AA88', // Gold accent
  text: '#FAFAFA', // business-text-primary
  textMuted: '#A1A1AA', // business-text-secondary
} as const;

/**
 * Convert hex color to HSL format for CSS variables
 * Tailwind expects HSL format: "h s% l%" (without hsl() wrapper)
 * @param hex Hex color string (e.g., "#3b82f6")
 * @returns HSL string in format "h s% l%" (e.g., "217 91% 60%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

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

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);

  return `${h} ${s}% ${lightness}%`;
}

/**
 * Validate hex color format
 * @param color Hex color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Get contrast color (black or white) for a given background color
 * Useful for determining text color on colored backgrounds
 * @param hexColor Background hex color
 * @returns "#000000" or "#ffffff"
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  hexColor = hexColor.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Validate logo file
 * @param file File object to validate
 * @returns Validation result with error message if invalid
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must not exceed 2MB',
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and SVG images are allowed',
    };
  }

  return { valid: true };
}

/**
 * Generate CSS custom properties object for theming
 * @param colors Branding colors object
 * @returns CSS custom properties object compatible with React.CSSProperties
 */
export function generateThemeStyles(colors: {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}): React.CSSProperties {
  return {
    '--primary': hexToHsl(colors.primary_color),
    '--primary-foreground': '0 0% 100%', // white
    '--secondary': hexToHsl(colors.secondary_color),
    '--secondary-foreground': '0 0% 100%', // white
    '--accent': hexToHsl(colors.accent_color),
    '--accent-foreground': '0 0% 100%', // white
  } as React.CSSProperties;
}

/**
 * Full color preset type with dark/light mode support
 * Uses ThemeConfig structure for consistency
 */
export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  accent: ThemeAccentColors;
  dark: ThemeModeColors;
  light: ThemeModeColors;
}

/**
 * Color presets for quick branding setup
 * Full dark/light mode palettes with professional aesthetics
 */
export const FULL_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'gold-luxury',
    name: 'Gold Luxury',
    description: 'Elegant gold accents with deep dark backgrounds',
    accent: {
      primary: '#C6AA88',
      secondary: '#14B8A6',
      tertiary: '#06B6D4',
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
  },
  {
    id: 'indigo-modern',
    name: 'Indigo Modern',
    description: 'Modern indigo theme inspired by Stripe/Linear',
    accent: {
      primary: '#6366F1',
      secondary: '#818CF8',
      tertiary: '#A5B4FC',
    },
    dark: {
      background: '#0F0F12',
      surface: '#1A1A1F',
      card: '#1E1E24',
      sidebar: '#0C0C0E',
      muted: '#27272A',
      text_primary: '#F8FAFC',
      text_secondary: '#94A3B8',
      border: '#27272A',
    },
    light: {
      background: '#FAFBFF',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#F8F9FC',
      muted: '#F1F5F9',
      text_primary: '#0F172A',
      text_secondary: '#64748B',
      border: '#E2E8F0',
    },
  },
  {
    id: 'emerald-fresh',
    name: 'Emerald Fresh',
    description: 'Fresh green theme for eco-conscious brands',
    accent: {
      primary: '#10B981',
      secondary: '#34D399',
      tertiary: '#6EE7B7',
    },
    dark: {
      background: '#0A0F0D',
      surface: '#141C18',
      card: '#18221D',
      sidebar: '#0C120F',
      muted: '#1C2D24',
      text_primary: '#F0FDF4',
      text_secondary: '#86EFAC',
      border: '#1C2D24',
    },
    light: {
      background: '#F0FDF4',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#ECFDF5',
      muted: '#DCFCE7',
      text_primary: '#052E16',
      text_secondary: '#166534',
      border: '#BBF7D0',
    },
  },
  {
    id: 'rose-elegant',
    name: 'Rose Elegant',
    description: 'Sophisticated rose theme for luxury services',
    accent: {
      primary: '#F43F5E',
      secondary: '#FB7185',
      tertiary: '#FDA4AF',
    },
    dark: {
      background: '#0F0A0B',
      surface: '#1A1314',
      card: '#1E1718',
      sidebar: '#0D0809',
      muted: '#2D1F21',
      text_primary: '#FFF1F2',
      text_secondary: '#FDA4AF',
      border: '#2D1F21',
    },
    light: {
      background: '#FFF1F2',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#FFFBFB',
      muted: '#FFE4E6',
      text_primary: '#1C0B0D',
      text_secondary: '#9F1239',
      border: '#FECDD3',
    },
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    description: 'Clean minimal theme with neutral tones',
    accent: {
      primary: '#64748B',
      secondary: '#94A3B8',
      tertiary: '#CBD5E1',
    },
    dark: {
      background: '#0F172A',
      surface: '#1E293B',
      card: '#243044',
      sidebar: '#0B1120',
      muted: '#334155',
      text_primary: '#F8FAFC',
      text_secondary: '#94A3B8',
      border: '#334155',
    },
    light: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#F1F5F9',
      muted: '#F1F5F9',
      text_primary: '#0F172A',
      text_secondary: '#64748B',
      border: '#E2E8F0',
    },
  },
  {
    id: 'amber-warm',
    name: 'Amber Warm',
    description: 'Warm amber theme for hospitality brands',
    accent: {
      primary: '#F59E0B',
      secondary: '#FBBF24',
      tertiary: '#FCD34D',
    },
    dark: {
      background: '#0F0D09',
      surface: '#1A1714',
      card: '#1E1B17',
      sidebar: '#0D0B08',
      muted: '#2D2614',
      text_primary: '#FFFBEB',
      text_secondary: '#FCD34D',
      border: '#2D2614',
    },
    light: {
      background: '#FFFBEB',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      sidebar: '#FEF3C7',
      muted: '#FEF3C7',
      text_primary: '#1C1203',
      text_secondary: '#92400E',
      border: '#FDE68A',
    },
  },
];


/**
 * Extract business domain from URL
 * @param url Full URL string
 * @returns Domain without protocol and path
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Check if domain is custom (not the platform domain)
 * @param hostname Current hostname
 * @param platformDomain Platform's base domain
 * @returns True if custom domain
 */
export function isCustomDomain(hostname: string, platformDomain: string): boolean {
  if (hostname === platformDomain) return false;
  if (hostname.endsWith(`.${platformDomain}`)) return false;
  if (hostname.includes('localhost')) return false;
  return true;
}

/**
 * Sanitize brand name for display
 * @param brandName Brand name to sanitize
 * @param fallbackName Fallback if brand name is empty
 * @returns Sanitized brand name
 */
export function sanitizeBrandName(brandName: string | null, fallbackName: string): string {
  if (!brandName || brandName.trim() === '') {
    return fallbackName;
  }
  return brandName.trim().substring(0, 100); // Max 100 characters
}

/**
 * Generate unique logo filename
 * @param businessId Business account ID
 * @param fileExtension File extension (e.g., "png")
 * @returns Unique filename with path
 */
export function generateLogoFilename(businessId: string, fileExtension: string): string {
  const timestamp = Date.now();
  return `${businessId}/logo_${timestamp}.${fileExtension}`;
}

/**
 * Get logo URL from storage path
 * @param storagePath Path in Supabase storage
 * @param storageUrl Supabase storage base URL
 * @returns Full public URL
 */
export function getLogoUrl(storagePath: string, storageUrl: string): string {
  return `${storageUrl}/business-logos/${storagePath}`;
}

/**
 * Extract business initials from business name
 * Used as fallback when logo is not available
 * @param businessName Business name to extract initials from
 * @returns Uppercase initials (max 2 characters)
 * @example "Acme Hotel" → "AH"
 * @example "TransferCo" → "TR"
 * @example "" → "BU"
 */
export function getBusinessInitials(businessName: string): string {
  if (!businessName || businessName.trim() === '') {
    return 'BU'; // Business fallback
  }

  const words = businessName.trim().split(/\s+/);

  if (words.length >= 2) {
    // Multiple words: take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    // Single word: take first two letters
    return businessName.trim().substring(0, 2).toUpperCase();
  }
}

/**
 * Convert a color preset to ThemeConfig format
 * @param preset ColorPreset to convert
 * @returns ThemeConfig object for database storage
 */
export function presetToThemeConfig(preset: ColorPreset): ThemeConfig {
  return {
    accent: preset.accent,
    dark: preset.dark,
    light: preset.light,
    _version: 1,
  };
}


// ============================================================================
// ThemeConfig Helpers
// ============================================================================

/**
 * Parse theme_config from database JSONB with defaults
 * Handles null/undefined values and ensures complete structure
 * @param themeConfig Raw theme_config from database (JSONB)
 * @returns Complete ThemeConfig with all values
 */
export function parseThemeConfig(themeConfig: unknown): ThemeConfig {
  // If null or not an object, return defaults
  if (!themeConfig || typeof themeConfig !== 'object') {
    return { ...DEFAULT_THEME_CONFIG };
  }

  const config = themeConfig as Record<string, unknown>;

  // Parse accent colors with defaults
  const accentRaw = config.accent as Record<string, unknown> | undefined;
  const accent: ThemeAccentColors = {
    primary: (accentRaw?.primary as string) || DEFAULT_THEME_CONFIG.accent.primary,
    secondary: (accentRaw?.secondary as string) || DEFAULT_THEME_CONFIG.accent.secondary,
    tertiary: (accentRaw?.tertiary as string) || DEFAULT_THEME_CONFIG.accent.tertiary,
  };

  // Parse dark mode colors with defaults
  const darkRaw = config.dark as Record<string, unknown> | undefined;
  const dark: ThemeModeColors = {
    background: (darkRaw?.background as string) || DEFAULT_THEME_CONFIG.dark.background,
    surface: (darkRaw?.surface as string) || DEFAULT_THEME_CONFIG.dark.surface,
    card: (darkRaw?.card as string) || DEFAULT_THEME_CONFIG.dark.card,
    sidebar: (darkRaw?.sidebar as string) || DEFAULT_THEME_CONFIG.dark.sidebar,
    muted: (darkRaw?.muted as string) || DEFAULT_THEME_CONFIG.dark.muted,
    text_primary: (darkRaw?.text_primary as string) || DEFAULT_THEME_CONFIG.dark.text_primary,
    text_secondary: (darkRaw?.text_secondary as string) || DEFAULT_THEME_CONFIG.dark.text_secondary,
    border: (darkRaw?.border as string) || DEFAULT_THEME_CONFIG.dark.border,
  };

  // Parse light mode colors with defaults
  const lightRaw = config.light as Record<string, unknown> | undefined;
  const light: ThemeModeColors = {
    background: (lightRaw?.background as string) || DEFAULT_THEME_CONFIG.light.background,
    surface: (lightRaw?.surface as string) || DEFAULT_THEME_CONFIG.light.surface,
    card: (lightRaw?.card as string) || DEFAULT_THEME_CONFIG.light.card,
    sidebar: (lightRaw?.sidebar as string) || DEFAULT_THEME_CONFIG.light.sidebar,
    muted: (lightRaw?.muted as string) || DEFAULT_THEME_CONFIG.light.muted,
    text_primary: (lightRaw?.text_primary as string) || DEFAULT_THEME_CONFIG.light.text_primary,
    text_secondary: (lightRaw?.text_secondary as string) || DEFAULT_THEME_CONFIG.light.text_secondary,
    border: (lightRaw?.border as string) || DEFAULT_THEME_CONFIG.light.border,
  };

  return {
    accent,
    dark,
    light,
    _version: (config._version as number) || 1,
  };
}

/**
 * Deep merge partial theme config with defaults
 * Use when updating theme config from form submission
 * @param partial Partial ThemeConfig (from form)
 * @param base Base ThemeConfig to merge with (defaults to DEFAULT_THEME_CONFIG)
 * @returns Complete ThemeConfig
 */
export function mergeThemeConfig(
  partial: Partial<ThemeConfig>,
  base: ThemeConfig = DEFAULT_THEME_CONFIG
): ThemeConfig {
  return {
    accent: {
      ...base.accent,
      ...partial.accent,
    },
    dark: {
      ...base.dark,
      ...partial.dark,
    },
    light: {
      ...base.light,
      ...partial.light,
    },
    _version: 1,
  };
}
