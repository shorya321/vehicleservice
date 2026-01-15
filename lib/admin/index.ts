/**
 * Admin Theme System - Client-safe Barrel File
 * Centralized exports for admin/vendor portal theming
 *
 * IMPORTANT: This file must only export client-safe code.
 *
 * Server Components should import directly:
 * - AdminThemeProvider from '@/lib/admin/theme-provider'
 * - getAdminThemeSettings/updateAdminThemeSettings from '@/lib/admin/theme-server'
 */

// Client-side context and hooks
export {
  AdminThemeContextProvider,
  useAdminTheme,
  useAdminDarkMode,
  useAdminAccentColor,
} from './theme-context';

// Client-safe utilities (pure functions and constants)
export {
  hexToHsl,
  mergeWithDefaults,
  generateThemeCSSVariables,
  DEFAULT_ADMIN_THEME,
} from './theme-utils';

// Types
export type { AdminThemeConfig } from './theme-utils';
