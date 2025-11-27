/**
 * Business Portal Animation Configuration
 * Timing constants, easing curves, and animation presets
 *
 * SCOPE: Business module ONLY
 */

// Duration constants (in seconds for Framer Motion)
export const duration = {
  instant: 0.1,
  quick: 0.15,
  base: 0.25,
  moderate: 0.35,
  slow: 0.5,
} as const;

// Duration in milliseconds (for CSS/JavaScript)
export const durationMs = {
  instant: 100,
  quick: 150,
  base: 250,
  moderate: 350,
  slow: 500,
} as const;

// Easing curves
export const easing = {
  // Standard ease out - deceleration
  easeOut: [0.4, 0, 0.2, 1] as const,

  // Ease in-out - acceleration then deceleration
  easeInOut: [0.4, 0, 0.2, 1] as const,

  // Spring-like bounce
  spring: [0.34, 1.56, 0.64, 1] as const,

  // Smooth ease
  smooth: [0.25, 0.1, 0.25, 1] as const,

  // Sharp ease for quick interactions
  sharp: [0.4, 0, 0.6, 1] as const,
} as const;

// Stagger delays (in seconds)
export const stagger = {
  cards: 0.06,
  list: 0.05,
  nav: 0.08,
  fast: 0.03,
  slow: 0.1,
} as const;

// Spring configurations for Framer Motion
export const springConfig = {
  gentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 10,
  },
  stiff: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  slow: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
  },
} as const;

// Transition presets
export const transition = {
  // Default transition
  default: {
    duration: duration.base,
    ease: easing.easeOut,
  },

  // Quick micro-interactions
  quick: {
    duration: duration.quick,
    ease: easing.easeOut,
  },

  // Slow, deliberate animations
  slow: {
    duration: duration.slow,
    ease: easing.easeInOut,
  },

  // Spring transition
  spring: springConfig.gentle,

  // Page transition
  page: {
    duration: duration.base,
    ease: easing.smooth,
  },
} as const;

// Viewport detection options for useInView
export const viewportOptions = {
  once: true,
  margin: '-50px',
  amount: 0.3,
} as const;

export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Stagger = keyof typeof stagger;
export type Transition = keyof typeof transition;
