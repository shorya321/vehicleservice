"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/lib/admin";
import { cn } from "@/lib/utils";

/**
 * Admin Portal Theme Toggle
 *
 * Animated sun/moon toggle for switching between dark and light modes.
 * Instant toggle without page reload - syncs to database in background.
 *
 * SCOPE: Admin/Vendor modules
 */

interface AdminThemeToggleProps {
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

export function AdminThemeToggle({ className, size = "default" }: AdminThemeToggleProps) {
  const { mode, toggleMode } = useAdminTheme();
  const config = sizeConfig[size];

  const isDark = mode === "dark";

  // Instant toggle - no API call, no reload
  const handleToggle = () => {
    toggleMode();
  };

  return (
    <motion.button
      onClick={handleToggle}
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
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
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
        className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}
