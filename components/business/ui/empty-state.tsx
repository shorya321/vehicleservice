'use client';

/**
 * Business Portal Empty State Component
 * Reusable empty state with icon, title, description, and optional action
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface EmptyStateProps {
  /** Icon to display (typically from lucide-react) */
  icon: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button/link */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Icon container variant */
  variant?: 'default' | 'primary' | 'muted';
}

const iconVariants = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = 'primary',
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Icon Container */}
      <motion.div
        initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl',
          iconVariants[variant]
        )}
      >
        <div className="h-8 w-8">{icon}</div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-2 text-lg font-medium text-foreground"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mb-6 text-sm max-w-sm text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {/* Action */}
      {action && (
        <motion.div
          initial={prefersReducedMotion ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

export default EmptyState;
