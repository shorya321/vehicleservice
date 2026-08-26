"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  parseThemeConfig,
  type ThemeConfig,
} from "@/lib/business/branding-utils";
import {
  buildThemeVars,
  THEME_VAR_NAMES,
  THEME_GUARD_GLOBAL,
} from "@/lib/business/theme-vars";

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

/**
 * Put the portal's mode on <html>, idempotently.
 *
 * Only writes when the value actually differs, which is what lets the
 * MutationObserver guard below re-apply without retriggering itself.
 */
function applyBusinessMode(mode: "dark" | "light"): void {
  const root = document.documentElement;

  if (!root.classList.contains(mode)) {
    root.classList.remove("light", "dark");
    root.classList.add(mode);
  }
  if (root.getAttribute("data-business-theme") !== mode) {
    root.setAttribute("data-business-theme", mode);
  }
}

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

  // Parse theme config with defaults.
  //
  // Memoised on purpose: parseThemeConfig returns a fresh object every call, and
  // `config` is a dependency of the branding effect below. Recomputed each
  // render, that effect's cleanup stripped all THEME_VAR_NAMES *and*
  // data-business-branding - the attribute the SSR stylesheet is scoped to -
  // on every single re-render, only to re-add them a moment later.
  const config = useMemo(() => parseThemeConfig(themeConfig), [themeConfig]);

  // Get system preference
  const getSystemTheme = (): "dark" | "light" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    queueMicrotask(() => setMounted(true));

    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initTheme = () => {
      if (stored) {
        setThemeState(stored);
      } else {
        // Default to dark mode for business portal
        setThemeState(defaultTheme);
      }
    };
    initTheme();
  }, [storageKey, defaultTheme]);

  // The mode the portal wants on <html>, kept in a ref so the guard below can
  // read it without being torn down and reinstalled every time `theme` changes.
  const desiredModeRef = React.useRef<"dark" | "light">("dark");

  // Resolve theme and apply to document
  useEffect(() => {
    if (!mounted) return;

    const resolved = theme === "system" ? getSystemTheme() : theme;
    desiredModeRef.current = resolved;
    const updateResolved = () => setResolvedTheme(resolved);
    updateResolved();

    applyBusinessMode(resolved);
  }, [theme, mounted]);

  // Hold the mode against next-themes.
  //
  // next-themes also owns the light/dark class on <html> (root layout, with
  // defaultTheme="system" enableSystem) and re-asserts the *system* preference
  // when it hydrates, which on a light-preference machine flips the portal to
  // light. Tailwind's `dark:` variants key off that same class, so this cannot be
  // sidestepped by scoping our own selectors elsewhere - the class has to be
  // right.
  //
  // Deliberately its own effect with only `[mounted]` as a dep, reading the mode
  // from a ref. Folding this into the effect above meant it was disconnected and
  // reinstalled on every `theme` change, and next-themes' hydration landed inside
  // exactly that window - leaving a ~24ms light frame that the guard was supposed
  // to prevent. Installed once, it corrects at the microtask boundary, before any
  // paint. The equality checks in applyBusinessMode keep it idempotent, so
  // re-applying cannot retrigger the observer into a loop.
  useEffect(() => {
    if (!mounted) return;

    // Take over from the bootstrap's guard. It has been holding the mode since
    // before hydration; leaving it running would keep forcing the portal's mode
    // after a client-side navigation out of the business module.
    const guards = window as unknown as Record<
      string,
      MutationObserver | undefined
    >;
    guards[THEME_GUARD_GLOBAL]?.disconnect();
    delete guards[THEME_GUARD_GLOBAL];

    const root = document.documentElement;
    const observer = new MutationObserver(() =>
      applyBusinessMode(desiredModeRef.current)
    );
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [mounted]);

  // Apply branding colors on mount and when theme changes
  // This OVERRIDES root layout inline styles for custom domains
  // Applies dark or light mode colors based on resolvedTheme
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Same derivation the portal layout serialises into its SSR <style>, so the
    // first paint and every subsequent update can never disagree. These land as
    // inline styles, which outrank that stylesheet - that is what makes a preset
    // switch or a mode toggle apply without a reload.
    const vars = buildThemeVars(config, resolvedTheme);
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }

    // Set data attribute to indicate business portal branding is active. The
    // SSR stylesheet is scoped to this attribute, so it must stay set for as
    // long as the portal is mounted.
    root.setAttribute("data-business-branding", "true");

    // Cleanup: remove branding styles when component unmounts
    return () => {
      for (const name of THEME_VAR_NAMES) {
        root.style.removeProperty(name);
      }
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

  // The provider is rendered unconditionally, on purpose.
  //
  // This used to return the bare <div> until `mounted` flipped, to "prevent a
  // hydration mismatch". It did not prevent one - server and first client render
  // both saw mounted === false, so hydration always matched. What it did do was
  // change the element type at this position on the very next render: <div> became
  // <Provider><div>. React cannot reconcile a changed type, so it threw the whole
  // portal away and rebuilt it, unmounting and remounting every page under the
  // layout on each load. Measured on /business/settings/email: 3 mounts and 2
  // unmounts of BusinessPortalContent per load, against 1 and 0 with the branch
  // gone. Every child effect ran three times, and any child state was discarded
  // twice before the page settled.
  //
  // Nothing needs the branch. The sole consumer, useBusinessThemeSafe, carries its
  // own mounted guard and returns the dark defaults until it flips, so the context
  // values published here before mount are never the ones a consumer reads.
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
    queueMicrotask(() => setMounted(true));
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
