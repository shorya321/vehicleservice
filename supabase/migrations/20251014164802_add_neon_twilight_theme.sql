-- Add Neon Twilight Premium Theme
-- Inspired by: Cyberpunk aesthetics + Apple refinement + Twitch energy
-- Best for: Tech startups, creative agencies, modern SaaS
-- Personality: Bold, innovative, creative

INSERT INTO theme_settings (name, is_active, config)
VALUES (
  'Neon Twilight',
  false,
  '{
    "typography": {
      "fontFamily": {
        "sans": "Geist",
        "serif": "Instrument Serif",
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
        "gold": "#A855F7",
        "goldLight": "#C084FC",
        "black": "#13111C",
        "darkGray": "#1F1B2E",
        "gray": "#2E2640",
        "lightGray": "#C4B5FD",
        "pearl": "#FAF5FF"
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
      "card": "0 10px 15px -3px rgba(168, 85, 247, 0.15), 0 4px 6px -2px rgba(19, 17, 28, 0.2)",
      "cardHover": "0 25px 50px -12px rgba(168, 85, 247, 0.25), 0 10px 20px -5px rgba(192, 132, 252, 0.15)",
      "gold": "0 10px 20px -5px rgba(168, 85, 247, 0.3), 0 4px 8px -4px rgba(192, 132, 252, 0.2)"
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
