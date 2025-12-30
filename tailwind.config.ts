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
        // Midnight Opulence - Extended Luxury Palette
        luxury: {
          // Gold Spectrum (graduated)
          goldPale: "#f4ece0",
          goldCream: "#e8d9c5",
          goldLight: "#d4c4a8",
          gold: "#c6aa88",
          goldMedium: "#b89b6a",
          goldDeep: "#a68b5b",
          goldDark: "#8b7349",
          // Deep Blacks with Warm Undertones
          void: "#050506",
          rich: "#0a0a0b",
          warm: "#0f0e0d",
          charcoal: "#161514",
          charcoalLight: "#1f1e1c",
          graphite: "#2a2826",
          // Legacy mappings for compatibility
          black: "#050506",
          darkGray: "#161514",
          gray: "#2a2826",
          lightGray: "#7a7672",
          pearl: "#f8f6f3",
          // Text Colors
          textPrimary: "#f8f6f3",
          textSecondary: "#b8b4ae",
          textMuted: "#7a7672",
        },
        // Business Portal Premium Design System
        business: {
          // Primary (Gold)
          primary: {
            50: "#FAF7F2",
            100: "#F0E9DE",
            200: "#E3D5C3",
            300: "#D4BC9A",
            400: "#C6AA88",
            500: "#B89B6A",
            600: "#A68B5B",
            700: "#8B7349",
            800: "#705C3A",
            900: "#5A4A2E",
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
        // Business portal shadows with gold glow
        "business-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "business-md": "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        "business-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        "business-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        "business-glow-sm": "0 0 15px -3px rgba(198, 170, 136, 0.2)",
        "business-glow": "0 0 20px -5px rgba(198, 170, 136, 0.3)",
        "business-glow-lg": "0 0 40px -10px rgba(198, 170, 136, 0.4)",
        "business-elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 0 20px -5px rgba(198, 170, 136, 0.15)",
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
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(198, 170, 136, 0.4)" },
          "50%": { boxShadow: "0 0 20px 5px rgba(198, 170, 136, 0.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-bottom": "fade-in-bottom 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
      },
      fontFamily: {
        // Midnight Opulence - Luxury Fonts
        serif: ["var(--font-cormorant)", "'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "'Outfit'", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "'Cormorant Garamond'", "Georgia", "serif"],
        body: ["var(--font-outfit)", "'Outfit'", "system-ui", "sans-serif"],
        // Business portal fonts
        "business-display": ["var(--font-jakarta)", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        "business-body": ["var(--font-inter)", "'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
