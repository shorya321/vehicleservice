import type { Config } from "tailwindcss"

/**
 * Tailwind Configuration with CSS Variable Theming Support
 *
 * This config supports white-labeling through CSS custom properties.
 * Colors are defined using hsl(var(--variable)) pattern, allowing
 * dynamic theming via CSS variables injected by middleware for
 * custom business domains.
 *
 * Example: When a custom domain is detected, middleware injects
 * brand colors into response headers, which are read by app/layout.tsx
 * and applied as CSS variables to override default theme colors.
 */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        luxury: {
          gold: "#C6AA88",
          goldLight: "#E8D9C5",
          black: "#0A0A0A",
          darkGray: "#181818",
          gray: "#2C2C2C",
          lightGray: "#B0B0B0",
          pearl: "#F5F5F5",
        },
        // Business Portal Premium Design System
        business: {
          // Primary (Indigo)
          primary: {
            50: "#EEF2FF",
            100: "#E0E7FF",
            200: "#C7D2FE",
            300: "#A5B4FC",
            400: "#818CF8",
            500: "#6366F1",
            600: "#4F46E5",
            700: "#4338CA",
            800: "#3730A3",
            900: "#312E81",
          },
          // Secondary (Teal)
          secondary: {
            300: "#5EEAD4",
            400: "#2DD4BF",
            500: "#14B8A6",
            600: "#0D9488",
          },
          // Surface layers (Dark mode)
          surface: {
            0: "#09090B",
            1: "#0F0F12",
            2: "#161619",
            3: "#1C1C21",
            4: "#27272A",
          },
          // Surface layers (Light mode)
          surfaceLight: {
            0: "#FFFFFF",
            1: "#F9FAFB",
            2: "#F3F4F6",
            3: "#E5E7EB",
            4: "#D1D5DB",
          },
          // Text (Dark mode)
          text: {
            primary: "#FAFAFA",
            secondary: "#A1A1AA",
            muted: "#52525B",
          },
          // Text (Light mode)
          textLight: {
            primary: "#111827",
            secondary: "#4B5563",
            muted: "#9CA3AF",
          },
          // Semantic colors
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#06B6D4",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
        gold: "0 10px 20px -5px rgba(198, 170, 136, 0.15), 0 4px 8px -4px rgba(198, 170, 136, 0.1)",
        // Business portal shadows with indigo glow
        "business-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "business-md": "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        "business-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        "business-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        "business-glow-sm": "0 0 15px -3px rgba(99, 102, 241, 0.3)",
        "business-glow": "0 0 20px -5px rgba(99, 102, 241, 0.4)",
        "business-glow-lg": "0 0 40px -10px rgba(99, 102, 241, 0.5)",
        "business-elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 0 20px -5px rgba(99, 102, 241, 0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-bottom": "fade-in-bottom 0.6s ease-out forwards",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-montserrat)", "sans-serif"],
        // Business portal fonts
        "business-display": ["var(--font-jakarta)", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "business-body": ["var(--font-inter)", "'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
