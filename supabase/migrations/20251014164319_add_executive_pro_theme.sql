-- Add Executive Pro Premium Theme
-- A world-class professional admin dashboard theme
-- Inspired by elite SaaS platforms like Stripe, Linear, and Vercel

INSERT INTO theme_settings (name, is_active, config)
VALUES (
  'Executive Pro',
  false,
  '{
    "typography": {
      "fontFamily": {
        "sans": "Inter",
        "serif": "Sora",
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
        "6xl": "3.75rem"
      },
      "fontWeight": {
        "normal": "400",
        "medium": "500",
        "semibold": "600",
        "bold": "700"
      },
      "lineHeight": {
        "tight": "1.25",
        "normal": "1.5",
        "relaxed": "1.75"
      },
      "letterSpacing": {
        "tight": "-0.025em",
        "normal": "0",
        "wide": "0.05em",
        "wider": "0.1em"
      }
    },
    "colors": {
      "luxury": {
        "gold": "#FBBF24",
        "goldLight": "#FDE68A",
        "black": "#0A0E27",
        "darkGray": "#1A1F3A",
        "gray": "#2D3455",
        "lightGray": "#94A3B8",
        "pearl": "#F8FAFC"
      }
    },
    "spacing": {
      "section": {
        "sm": "3rem",
        "md": "5rem",
        "lg": "7rem"
      },
      "container": {
        "sm": "1rem",
        "md": "1.5rem",
        "lg": "2rem"
      }
    },
    "borderRadius": {
      "sm": "0.25rem",
      "md": "0.5rem",
      "lg": "0.75rem",
      "xl": "1rem",
      "full": "9999px"
    },
    "shadows": {
      "card": "0 10px 15px -3px rgba(10, 14, 39, 0.3), 0 4px 6px -2px rgba(10, 14, 39, 0.2)",
      "cardHover": "0 25px 50px -12px rgba(10, 14, 39, 0.4), 0 10px 20px -5px rgba(251, 191, 36, 0.1)",
      "gold": "0 10px 20px -5px rgba(251, 191, 36, 0.2), 0 4px 8px -4px rgba(251, 191, 36, 0.15)"
    },
    "animations": {
      "duration": {
        "fast": "150ms",
        "normal": "300ms",
        "slow": "500ms"
      },
      "easing": {
        "default": "ease-in-out",
        "in": "ease-in",
        "out": "ease-out"
      }
    }
  }'::jsonb
);

-- Add comment explaining the theme
COMMENT ON TABLE theme_settings IS 'Executive Pro: Premium professional admin theme with deep navy, amber gold accents, and Inter font. Designed for executive-level interfaces.';
