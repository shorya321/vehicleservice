"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { hexToHsl } from "@/lib/business/branding-utils";

/**
 * Business Portal Theme Provider
 *
 * Manages dark/light mode for the business portal with:
 * - System preference detection
 * - LocalStorage persistence
 * - Smooth transitions
 * - Branding color application (overrides root layout inline styles)
 *
 * SCOPE: Business module ONLY
 */

type Theme = "dark" | "light" | "system";

interface BrandingColors {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
}

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

// Default business portal colors (gold theme)
const DEFAULT_BRANDING_COLORS = {
  primary: "#C6AA88",     // Gold
  secondary: "#14B8A6",   // Teal
  accent: "#06B6D4",      // Cyan
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  brandingColors?: BrandingColors;
}

export function BusinessThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = STORAGE_KEY,
  brandingColors,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

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

  // Apply branding colors on mount - this OVERRIDES root layout inline styles
  // This ensures business portal uses its own gold theme regardless of custom domain overrides
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Determine which colors to use: provided branding or defaults
    const primary = brandingColors?.primary || DEFAULT_BRANDING_COLORS.primary;
    const secondary = brandingColors?.secondary || DEFAULT_BRANDING_COLORS.secondary;
    const accent = brandingColors?.accent || DEFAULT_BRANDING_COLORS.accent;

    // Apply business portal branding colors as CSS variables
    // These override any inline styles set by root layout for custom domains
    root.style.setProperty("--primary", hexToHsl(primary));
    root.style.setProperty("--primary-foreground", "240 10% 4%"); // Dark text on gold
    root.style.setProperty("--secondary", hexToHsl(secondary));
    root.style.setProperty("--accent", hexToHsl(accent));
    root.style.setProperty("--ring", hexToHsl(primary));

    // Set data attribute to indicate business portal branding is active
    root.setAttribute("data-business-branding", "true");

    // Cleanup: remove branding styles when component unmounts
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
      root.removeAttribute("data-business-branding");
    };
  }, [mounted, brandingColors]);

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
