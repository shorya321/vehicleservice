/**
 * Business Portal Animation Variants
 * Reusable Framer Motion variants for consistent animations
 *
 * SCOPE: Business module ONLY
 */

import type { Variants } from 'framer-motion';
import { duration, easing, stagger } from './config';

// Fade in from bottom (default page content animation)
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
};

// Simple fade
export const fade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.quick,
    },
  },
};

// Scale in (for modals, popovers)
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: duration.quick,
    },
  },
};

// Slide from left (for sidebar items)
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
};

// Slide from right
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
};

// Page transition variant
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.base,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
};

// Stagger container for children animations
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.cards,
      delayChildren: 0.1,
    },
  },
};

// Stagger container (fast)
export const staggerContainerFast: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.fast,
      delayChildren: 0.05,
    },
  },
};

// Stagger item (use inside stagger container)
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.base,
      ease: easing.easeOut,
    },
  },
};

// Card hover animation
export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.25)',
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px -4px rgba(99, 102, 241, 0.25)',
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
  },
};

// Button press animation
export const buttonPress: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
  tap: {
    scale: 0.98,
  },
};

// Sidebar collapse animation
export const sidebarCollapse: Variants = {
  expanded: {
    width: 264,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
    },
  },
  collapsed: {
    width: 72,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
    },
  },
};

// Nav item text visibility
export const navItemText: Variants = {
  expanded: {
    opacity: 1,
    width: 'auto',
    transition: {
      duration: duration.quick,
      delay: 0.1,
    },
  },
  collapsed: {
    opacity: 0,
    width: 0,
    transition: {
      duration: duration.quick,
    },
  },
};

// Tooltip animation
export const tooltip: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    x: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
};

// Table row hover
export const tableRowHover: Variants = {
  rest: {
    backgroundColor: 'transparent',
  },
  hover: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    transition: {
      duration: duration.quick,
    },
  },
};

// Wizard step transition (horizontal slide)
export const wizardStep: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
    },
  }),
};

// Notification slide in
export const notification: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.base,
      ease: easing.spring,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: duration.quick,
    },
  },
};
