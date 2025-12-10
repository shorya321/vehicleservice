/**
 * Auth Form Panel Component
 * Right side of split-screen auth layout with form container
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  authFormPanel,
  authFormItem,
  authIconBadge,
  authStaggerContainer,
} from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface AuthFormPanelProps {
  /** Form panel content */
  children: ReactNode;
  /** Max width of the form container */
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function AuthFormPanel({
  children,
  maxWidth = 'md',
  className,
}: AuthFormPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <div className={cn('auth-form-panel', className)}>
      <MotionWrapper
        {...(!prefersReducedMotion && {
          variants: authFormPanel,
          initial: 'hidden',
          animate: 'visible',
        })}
        className={cn('w-full mx-auto', maxWidthClasses[maxWidth])}
      >
        {children}
      </MotionWrapper>
    </div>
  );
}

/**
 * Auth form card with glassmorphism styling
 */
interface AuthFormCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthFormCard({ children, className }: AuthFormCardProps) {
  return (
    <div className={cn('auth-glass-card p-8 md:p-10', className)}>
      {children}
    </div>
  );
}

/**
 * Auth form header with icon badge and title
 */
interface AuthFormHeaderProps {
  /** Icon to display in the badge */
  icon: ReactNode;
  /** Main title */
  title: string;
  /** Description below the title */
  description?: string;
  /** Additional class names */
  className?: string;
}

export function AuthFormHeader({
  icon,
  title,
  description,
  className,
}: AuthFormHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <div className={cn('text-center mb-8', className)}>
      {/* Icon Badge */}
      <MotionWrapper
        {...(!prefersReducedMotion && { variants: authIconBadge })}
        className="flex justify-center mb-5"
      >
        <div className="p-4 rounded-2xl bg-[var(--luxury-gold)]/10 border border-[var(--luxury-gold)]/20">
          <div className="text-[var(--luxury-gold)] auth-icon-glow">
            {icon}
          </div>
        </div>
      </MotionWrapper>

      {/* Title */}
      <MotionWrapper {...(!prefersReducedMotion && { variants: authFormItem })}>
        <h1 className="luxury-text-display text-2xl md:text-3xl mb-2">
          {title}
        </h1>
      </MotionWrapper>

      {/* Description */}
      {description && (
        <MotionWrapper {...(!prefersReducedMotion && { variants: authFormItem })}>
          <p className="luxury-text-body text-base">
            {description}
          </p>
        </MotionWrapper>
      )}
    </div>
  );
}

/**
 * Animated form container for staggered field animations
 */
interface AuthFormContainerProps {
  children: ReactNode;
  className?: string;
}

export function AuthFormContainer({ children, className }: AuthFormContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={authStaggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated form field wrapper
 */
interface AuthFormFieldProps {
  children: ReactNode;
  className?: string;
}

export function AuthFormField({ children, className }: AuthFormFieldProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={authFormItem} className={className}>
      {children}
    </motion.div>
  );
}
