-- Clean up old basic themes and add Aurora Pro
-- Modern, vibrant, tech-forward theme inspired by Vercel + Linear

-- Remove old basic themes (keep Infinia Luxury)
DELETE FROM theme_settings
WHERE name IN ('Platinum Drive', 'Midnight Prestige', 'Neon Twilight', 'Digital Zen', 'Royal Tech', 'Executive Pro');

-- Add Aurora Pro: World-Class 2025 Admin Dashboard Theme
INSERT INTO theme_settings (name, is_active, config)
VALUES (
  'Aurora Pro',
  false,
  '{
    "typography": {
      "fontFamily": {
        "sans": "Geist",
        "serif": "Fraunces",
        "mono": "Geist Mono"
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
        "gold": "#6366F1",
        "goldLight": "#818CF8",
        "black": "#0A0A0B",
        "darkGray": "#18181B",
        "gray": "#27272A",
        "lightGray": "#A1A1AA",
        "pearl": "#FAFAFA"
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
        "sm": "0.375rem",
      "md": "0.75rem",
      "lg": "1rem",
      "xl": "1.5rem",
      "2xl": "2rem",
      "full": "9999px"
    },
    "shadows": {
      "xs": "0 1px 2px 0 rgba(99, 102, 241, 0.05)",
      "sm": "0 1px 3px 0 rgba(99, 102, 241, 0.1), 0 1px 2px -1px rgba(99, 102, 241, 0.1)",
      "card": "0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -2px rgba(99, 102, 241, 0.1)",
      "cardHover": "0 20px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(99, 102, 241, 0.1)",
      "gold": "0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(129, 140, 248, 0.2)",
      "lg": "0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -4px rgba(99, 102, 241, 0.1)",
      "xl": "0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1)",
      "2xl": "0 25px 50px -12px rgba(99, 102, 241, 0.25)"
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
