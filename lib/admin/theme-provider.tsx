import { ReactNode } from 'react';
import { getAdminThemeSettings } from './theme-server';
import { AdminThemeContextProvider } from './theme-context';

/**
 * Admin Theme Provider
 * Server component that fetches theme from database and passes to context
 *
 * CSS variables are applied by AdminThemeContextProvider on the client
 * via applyThemeToDOM() which sets them directly on document.documentElement.
 * This ensures theme toggle works instantly without page reload.
 *
 * Usage:
 * Wrap admin/vendor layouts with this provider to apply the theme
 *
 * <AdminThemeProvider>
 *   {children}
 * </AdminThemeProvider>
 */

interface AdminThemeProviderProps {
  children: ReactNode;
}

export async function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  // Fetch theme from database
  const theme = await getAdminThemeSettings();

  // Context provider handles all CSS variable application on client
  return (
    <AdminThemeContextProvider theme={theme}>
      {children}
    </AdminThemeContextProvider>
  );
}

/**
 * Re-export utilities for convenience
 */
export { getAdminThemeSettings, updateAdminThemeSettings } from './theme-server';
export type { AdminThemeConfig } from './theme-utils';
export { useAdminTheme, useAdminDarkMode, useAdminAccentColor } from './theme-context';
