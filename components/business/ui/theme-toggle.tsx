"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useBusinessThemeSafe } from "@/lib/business/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Business Portal Theme Toggle
 *
 * Animated sun/moon toggle for switching between dark and light modes.
 * Features smooth morph animation between icons.
 *
 * SCOPE: Business module ONLY
 */

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg";
}

const sizeConfig = {
  sm: {
    button: "h-8 w-8",
    icon: 14,
  },
  default: {
    button: "h-9 w-9",
    icon: 16,
  },
  lg: {
    button: "h-10 w-10",
    icon: 18,
  },
};

export function ThemeToggle({ className, size = "default" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useBusinessThemeSafe();
  const config = sizeConfig[size];

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg",
        "bg-transparent hover:bg-primary/10",
        "border border-transparent hover:border-primary/20",
        "text-muted-foreground hover:text-primary",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        config.button,
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolvedTheme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Moon size={config.icon} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Sun size={config.icon} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        style={{
          background: "radial-gradient(circle, rgba(198, 170, 136, 0.15) 0%, transparent 70%)",
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}

// Variant with label
interface ThemeToggleWithLabelProps extends ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggleWithLabel({
  className,
  size = "default",
  showLabel = true,
}: ThemeToggleWithLabelProps) {
  const { resolvedTheme, toggleTheme } = useBusinessThemeSafe();
  const config = sizeConfig[size];

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2",
        "bg-transparent hover:bg-primary/10",
        "border border-transparent hover:border-primary/20",
        "text-muted-foreground hover:text-primary",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolvedTheme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            <Moon size={config.icon} />
            {showLabel && (
              <span className="text-sm font-medium">Dark</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            <Sun size={config.icon} />
            {showLabel && (
              <span className="text-sm font-medium">Light</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
