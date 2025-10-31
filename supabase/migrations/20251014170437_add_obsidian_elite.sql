-- Add Obsidian Elite: Sophisticated Luxury Theme
-- Minimal, elegant, refined - inspired by Stripe + Apple

INSERT INTO theme_settings (name, is_active, config)
VALUES (
  'Obsidian Elite',
  false,
  '{
    "typography": {
      "fontFamily": {
        "sans": "Inter",
        "serif": "DM Serif Display",
        "mono": "JetBrains Mono"
      },
      "fontSize": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
        "8xl": "6rem",
        "9xl": "8rem"
      },
      "fontWeight": {
        "thin": "100",
        "extralight": "200",
        "light": "300",
        "normal": "400",
        "medium": "500",
        "semibold": "600",
        "bold": "700",
        "extrabold": "800",
        "black": "900"
      },
      "lineHeight": {
        "none": "1",
        "tight": "1.25",
        "snug": "1.375",
        "normal": "1.5",
        "relaxed": "1.625",
        "loose": "2"
      },
      "letterSpacing": {
        "tighter": "-0.05em",
        "tight": "-0.025em",
        "normal": "0",
        "wide": "0.025em",
        "wider": "0.05em",
        "widest": "0.1em"
      }
    },
    "colors": {
      "luxury": {
        "gold": "#10B981",
        "goldLight": "#34D399",
        "black": "#000000",
        "darkGray": "#0F1011",
        "gray": "#1A1B1C",
        "lightGray": "#9CA3AF",
        "pearl": "#FFFFFF"
      }
    },
    "spacing": {
      "section": {
        "sm": "2rem",
        "md": "4rem",
        "lg": "6rem",
        "xl": "8rem"
      },
      "container": {
        "sm": "1rem",
        "md": "1.5rem",
        "lg": "2rem",
        "xl": "3rem"
      }
    },
    "borderRadius": {
      "none": "0",
      "sm": "0.5rem",
      "md": "0.75rem",
      "lg": "1.125rem",
      "xl": "1.5rem",
      "2xl": "2rem",
      "full": "9999px"
    },
    "shadows": {
      "xs": "0 1px 2px 0 rgba(16, 185, 129, 0.05)",
      "sm": "0 1px 3px 0 rgba(16, 185, 129, 0.08), 0 1px 2px -1px rgba(16, 185, 129, 0.08)",
      "card": "0 4px 6px -1px rgba(16, 185, 129, 0.08), 0 2px 4px -2px rgba(16, 185, 129, 0.08)",
      "cardHover": "0 20px 25px -5px rgba(16, 185, 129, 0.12), 0 8px 10px -6px rgba(16, 185, 129, 0.1)",
      "gold": "0 0 20px rgba(16, 185, 129, 0.2), 0 0 40px rgba(52, 211, 153, 0.15)",
      "lg": "0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -4px rgba(16, 185, 129, 0.1)",
      "xl": "0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 8px 10px -6px rgba(16, 185, 129, 0.1)",
      "2xl": "0 25px 50px -12px rgba(16, 185, 129, 0.2)"
    },
    "animations": {
      "duration": {
        "fast": "100ms",
        "normal": "200ms",
        "slow": "300ms",
        "slower": "500ms"
      },
      "easing": {
        "default": "cubic-bezier(0.4, 0, 0.2, 1)",
        "in": "cubic-bezier(0.4, 0, 1, 1)",
        "out": "cubic-bezier(0, 0, 0.2, 1)",
        "inOut": "cubic-bezier(0.4, 0, 0.2, 1)"
      }
    }
  }'::jsonb
);
