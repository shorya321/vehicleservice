/**
 * Auth Page Animation Wrapper
 * Provides consistent entrance animations for authentication pages
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface AuthPageWrapperProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const iconBadgeVariants = {
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

const headerVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const footerVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.1,
    },
  },
};

// Export motion components for granular control
export const MotionIconBadge = motion.div;
export const MotionHeader = motion.div;
export const MotionCard = motion.div;
export const MotionFooter = motion.div;

// Export variants for use in pages
export const authAnimations = {
  container: containerVariants,
  iconBadge: iconBadgeVariants,
  header: headerVariants,
  card: cardVariants,
  footer: footerVariants,
};

export function AuthPageWrapper({ children, className }: AuthPageWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual animated components for flexible composition
export function AnimatedIconBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={iconBadgeVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function AnimatedHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={headerVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={cardVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function AnimatedFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={footerVariants} className={className}>
      {children}
    </motion.div>
  );
}
