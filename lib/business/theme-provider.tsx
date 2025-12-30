"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  hexToHsl,
  parseThemeConfig,
  DEFAULT_THEME_CONFIG,
  type ThemeConfig,
} from "@/lib/business/branding-utils";

/**
 * Business Portal Theme Provider
 *
 * Manages dark/light mode for the business portal with:
 * - System preference detection
 * - LocalStorage persistence
 * - Smooth transitions
 * - Full branding color application (dark/light mode support)
 * - Overrides root layout inline styles for custom domains
 *
 * SCOPE: Business module ONLY
 */

type Theme = "dark" | "light" | "system";

interface ThemeProviderContextValue {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeProviderContext = createContext<ThemeProviderContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "business-theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  /** Theme configuration from database (JSONB) */
  themeConfig?: ThemeConfig | unknown;
}

export function BusinessThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = STORAGE_KEY,
  themeConfig,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Parse theme config with defaults
  const config = parseThemeConfig(themeConfig);

  // Get system preference
  const getSystemTheme = (): "dark" | "light" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setThemeState(stored);
    } else {
      // Default to dark mode for business portal
      setThemeState(defaultTheme);
    }
  }, [storageKey, defaultTheme]);

  // Resolve theme and apply to document
  useEffect(() => {
    if (!mounted) return;

    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply theme class to the business portal root
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add the resolved theme class
    root.classList.add(resolved);

    // Also set a data attribute for more flexible styling
    root.setAttribute("data-business-theme", resolved);
  }, [theme, mounted]);

  // Apply branding colors on mount and when theme changes
  // This OVERRIDES root layout inline styles for custom domains
  // Applies dark or light mode colors based on resolvedTheme
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    // Get accent colors from config
    const primary = config.accent.primary;
    const secondary = config.accent.secondary;
    const tertiary = config.accent.tertiary;

    // Get mode-specific colors based on resolved theme
    const modeColors = isDark ? config.dark : config.light;

    // Apply accent colors (shared across modes)
    root.style.setProperty("--primary", hexToHsl(primary));
    root.style.setProperty("--primary-foreground", isDark ? "240 10% 4%" : "0 0% 100%");
    root.style.setProperty("--secondary", hexToHsl(secondary));
    root.style.setProperty("--secondary-foreground", "0 0% 100%");
    root.style.setProperty("--accent", hexToHsl(tertiary));
    root.style.setProperty("--accent-foreground", "0 0% 100%");
    root.style.setProperty("--ring", hexToHsl(primary));

    // Apply mode-specific colors as CSS variables
    // These map to business portal CSS variable system
    root.style.setProperty("--background", hexToHsl(modeColors.background));
    root.style.setProperty("--foreground", hexToHsl(modeColors.text_primary));
    root.style.setProperty("--card", hexToHsl(modeColors.card));
    root.style.setProperty("--card-foreground", hexToHsl(modeColors.text_primary));
    root.style.setProperty("--popover", hexToHsl(modeColors.surface));
    root.style.setProperty("--popover-foreground", hexToHsl(modeColors.text_primary));
    root.style.setProperty("--muted", hexToHsl(modeColors.muted));
    root.style.setProperty("--muted-foreground", hexToHsl(modeColors.text_secondary));
    root.style.setProperty("--border", hexToHsl(modeColors.border));
    root.style.setProperty("--input", hexToHsl(modeColors.border));

    // Business-specific CSS variables for sidebar and surfaces
    // These use HEX values directly since they're used as var(--business-*) without hsl() wrapper
    root.style.setProperty("--business-sidebar", modeColors.sidebar);
    root.style.setProperty("--business-surface", modeColors.surface);
    root.style.setProperty("--business-card", modeColors.card);
    root.style.setProperty("--business-border", modeColors.border);
    root.style.setProperty("--business-text-primary", modeColors.text_primary);
    root.style.setProperty("--business-text-secondary", modeColors.text_secondary);

    // Set data attribute to indicate business portal branding is active
    root.setAttribute("data-business-branding", "true");

    // Cleanup: remove branding styles when component unmounts
    return () => {
      // Accent colors
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--secondary-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--ring");
      // Mode colors
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--card-foreground");
      root.style.removeProperty("--popover");
      root.style.removeProperty("--popover-foreground");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--muted-foreground");
      root.style.removeProperty("--border");
      root.style.removeProperty("--input");
      // Business-specific
      root.style.removeProperty("--business-sidebar");
      root.style.removeProperty("--business-surface");
      root.style.removeProperty("--business-card");
      root.style.removeProperty("--business-border");
      root.style.removeProperty("--business-text-primary");
      root.style.removeProperty("--business-text-secondary");
      root.removeAttribute("data-business-branding");
    };
  }, [mounted, config, resolvedTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setResolvedTheme(getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="business-mesh-bg" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      <div className="business-mesh-bg" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeProviderContext.Provider>
  );
}

export function useBusinessTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useBusinessTheme must be used within a BusinessThemeProvider");
  }
  return context;
}

// Hook that safely handles SSR - returns default values before mount
export function useBusinessThemeSafe() {
  const [mounted, setMounted] = useState(false);
  const context = useContext(ThemeProviderContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || context === undefined) {
    return {
      theme: "dark" as Theme,
      resolvedTheme: "dark" as const,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }

  return context;
}
