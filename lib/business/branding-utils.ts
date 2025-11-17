/**
 * Branding Utilities
 * Helper functions for white-label branding operations
 */

/**
 * Default branding colors - using luxury theme
 * Applied when business hasn't customized branding
 */
export const DEFAULT_BRANDING = {
  primary_color: '#181818', // luxury-darkGray
  secondary_color: '#C6AA88', // luxury-gold
  accent_color: '#C6AA88', // luxury-gold
} as const;

/**
 * Luxury theme colors matching admin dashboard
 * Used as default for business portal before customization
 * Colors from tailwind.config.ts luxury palette
 */
export const LUXURY_THEME = {
  background: '#181818', // luxury-darkGray
  border: '#C6AA88', // luxury-gold
  accent: '#C6AA88', // luxury-gold
  text: '#F5F5F5', // luxury-pearl
  textMuted: '#B0B0B0', // luxury-lightGray
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
 * Color presets for quick branding setup
 * Professional dark backgrounds with tasteful accents for premium appearance
 */
export const COLOR_PRESETS = [
  {
    name: 'Luxury',
    primary: '#181818',
    secondary: '#C6AA88',
    accent: '#C6AA88',
  },
  {
    name: 'Executive',
    primary: '#1e293b',
    secondary: '#60a5fa',
    accent: '#60a5fa',
  },
  {
    name: 'Forest',
    primary: '#1e3a2e',
    secondary: '#86efac',
    accent: '#86efac',
  },
  {
    name: 'Midnight',
    primary: '#2d1b3d',
    secondary: '#c084fc',
    accent: '#c084fc',
  },
] as const;

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
