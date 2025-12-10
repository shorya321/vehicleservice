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

// Stagger container for children animations - refined timing
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// Stagger container (fast) - for lists and grids
export const staggerContainerFast: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
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

// Card hover animation - refined and subtle
export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  },
  hover: {
    y: -2,
    boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.3), 0 0 15px -4px rgba(201, 168, 124, 0.15)',
    transition: {
      duration: 0.15,
      ease: easing.easeOut,
    },
  },
  tap: {
    y: 0,
    scale: 0.99,
  },
};

// Button press animation - subtle and responsive
export const buttonPress: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.01,
    transition: {
      duration: 0.12,
      ease: easing.easeOut,
    },
  },
  tap: {
    scale: 0.99,
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

// Table row hover - with gold accent
export const tableRowHover: Variants = {
  rest: {
    backgroundColor: 'transparent',
  },
  hover: {
    backgroundColor: 'rgba(201, 168, 124, 0.05)',
    transition: {
      duration: 0.12,
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

// ============================================
// AUTH PAGE ANIMATIONS
// Luxury split-screen authentication flow
// ============================================

// Brand panel (left side) - slides in from left
export const authBrandPanel: Variants = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.slow,
      ease: easing.smooth,
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// Form panel (right side) - slides in from right
export const authFormPanel: Variants = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
      delay: 0.3,
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

// Auth tagline animation (staggered text reveal)
export const authTagline: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.moderate,
      ease: easing.easeOut,
    },
  },
};

// Auth form item animation
export const authFormItem: Variants = {
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
};

// Auth alert animation
export const authAlert: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
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
      ease: easing.easeOut,
    },
  },
};

// Auth social button stagger
export const authSocialButton: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.quick,
      ease: easing.easeOut,
    },
  },
};

// Auth icon badge animation
export const authIconBadge: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// Auth brand logo animation
export const authBrandLogo: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.moderate,
      ease: easing.spring,
    },
  },
};

// Auth stagger container for form elements
export const authStaggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Floating particle animation (for brand panel)
export const authParticle: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom: number) => ({
    opacity: [0.2, 0.5, 0.2],
    y: [0, -15, 0],
    transition: {
      duration: 4 + custom,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: custom * 0.5,
    },
  }),
};
