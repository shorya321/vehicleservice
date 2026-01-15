'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AdminThemeConfig } from './theme-utils';
import { DEFAULT_ADMIN_THEME, hexToHsl } from './theme-utils';

/**
 * Admin Theme Context
 * Provides theme configuration to admin/vendor portal components
 *
 * Features:
 * - Instant theme toggle (no page reload)
 * - localStorage persistence
 * - Background sync to database
 */

const ADMIN_THEME_STORAGE_KEY = 'admin-theme-mode';

interface AdminThemeContextValue {
  theme: AdminThemeConfig;
  mode: 'dark' | 'light';
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: DEFAULT_ADMIN_THEME,
  mode: 'dark',
  setMode: () => {},
  toggleMode: () => {},
});

export interface AdminThemeContextProviderProps {
  children: ReactNode;
  theme: AdminThemeConfig;
}

/**
 * Apply theme CSS variables to DOM
 * This enables instant theme switching without page reload
 */
function applyThemeToDOM(config: AdminThemeConfig, mode: 'dark' | 'light') {
  const root = document.documentElement;
  const colors = mode === 'dark' ? config.dark : config.light;

  // Apply theme class - match business module pattern
  root.classList.remove('light', 'dark');
  root.classList.add(mode);

  // Apply CSS variables
  root.style.setProperty('--background', hexToHsl(colors.background));
  root.style.setProperty('--foreground', hexToHsl(colors.text_primary));
  root.style.setProperty('--card', hexToHsl(colors.card));
  root.style.setProperty('--card-foreground', hexToHsl(colors.text_primary));
  root.style.setProperty('--popover', hexToHsl(colors.card));
  root.style.setProperty('--popover-foreground', hexToHsl(colors.text_primary));
  root.style.setProperty('--muted', hexToHsl(colors.muted));
  root.style.setProperty('--muted-foreground', hexToHsl(colors.text_secondary));
  root.style.setProperty('--border', hexToHsl(colors.border));
  root.style.setProperty('--input', hexToHsl(colors.border));

  // Primary color (accent) - shared across modes
  const primaryHsl = hexToHsl(config.accent.primary);
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--primary-foreground', mode === 'dark' ? '240 10% 4%' : '0 0% 100%');
  root.style.setProperty('--secondary', hexToHsl(colors.muted));
  root.style.setProperty('--secondary-foreground', hexToHsl(colors.text_primary));
  root.style.setProperty('--accent', primaryHsl);
  root.style.setProperty('--accent-foreground', mode === 'dark' ? '240 10% 4%' : '240 10% 4%');
  root.style.setProperty('--ring', primaryHsl);

  // Admin-specific variables
  root.style.setProperty('--admin-primary', config.accent.primary);
  root.style.setProperty('--admin-secondary', config.accent.secondary);
  root.style.setProperty('--admin-tertiary', config.accent.tertiary);
  root.style.setProperty('--admin-surface-0', colors.background);
  root.style.setProperty('--admin-surface-1', colors.surface);
  root.style.setProperty('--admin-surface-2', colors.card);
  root.style.setProperty('--admin-text-primary', colors.text_primary);
  root.style.setProperty('--admin-text-secondary', colors.text_secondary);
  root.style.setProperty('--accent-gold', config.accent.primary);
  root.style.setProperty('--accent-gold-light', config.accent.secondary);
}

/**
 * Client-side context provider for admin theme
 * Supports instant theme toggle without page reload
 */
export function AdminThemeContextProvider({
  children,
  theme: initialTheme,
}: AdminThemeContextProviderProps) {
  const [mode, setModeState] = useState<'dark' | 'light'>(initialTheme.mode);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY) as 'dark' | 'light' | null;
    if (stored && (stored === 'dark' || stored === 'light')) {
      setModeState(stored);
      applyThemeToDOM(initialTheme, stored);
    } else {
      // Apply initial theme even without localStorage
      applyThemeToDOM(initialTheme, initialTheme.mode);
    }
  }, [initialTheme]);

  // Apply theme when mode changes
  useEffect(() => {
    if (!mounted) return;
    applyThemeToDOM(initialTheme, mode);
  }, [mode, initialTheme, mounted]);

  const setMode = (newMode: 'dark' | 'light') => {
    setModeState(newMode);
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, newMode);

    // Background sync to database (non-blocking)
    fetch('/api/admin/theme-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode }),
    }).catch(console.error);
  };

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const contextValue: AdminThemeContextValue = {
    theme: { ...initialTheme, mode },
    mode,
    setMode,
    toggleMode,
  };

  return (
    <AdminThemeContext.Provider value={contextValue}>
      {children}
    </AdminThemeContext.Provider>
  );
}

/**
 * Hook to access admin theme in client components
 */
export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeContextProvider');
  }
  return context;
}

/**
 * Hook to check if dark mode is active
 */
export function useAdminDarkMode() {
  const { mode } = useAdminTheme();
  return mode === 'dark';
}

/**
 * Hook to get primary accent color
 */
export function useAdminAccentColor() {
  const { theme } = useAdminTheme();
  return theme.accent.primary;
}
