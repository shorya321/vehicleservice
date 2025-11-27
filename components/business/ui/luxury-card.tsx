/**
 * Luxury Card Component
 * Premium card variants with CVA styling
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

const luxuryCardVariants = cva(
  'rounded-2xl border backdrop-blur-md transition-all',
  {
    variants: {
      variant: {
        default:
          'border-[var(--business-border-default)] bg-[var(--business-surface-1)]/80',
        hero:
          'border-[var(--business-primary-500)]/30 bg-gradient-to-br from-[var(--business-surface-1)] via-[var(--business-surface-2)] to-[var(--business-surface-1)] shadow-business-elevated',
        interactive:
          'border-[var(--business-border-default)] bg-[var(--business-surface-1)]/80 cursor-pointer hover:border-[var(--business-primary-500)]/40 hover:shadow-business-glow hover:-translate-y-1',
        stat:
          'border-[var(--business-border-subtle)] bg-[var(--business-surface-1)]/60',
        elevated:
          'border-[var(--business-border-default)] bg-[var(--business-surface-1)] shadow-business-elevated',
        glass:
          'border-[var(--business-border-subtle)] bg-[var(--business-surface-1)]/60 backdrop-blur-xl',
        gradient:
          'border-[var(--business-primary-500)]/20 bg-gradient-to-br from-[var(--business-primary-500)]/5 to-[var(--business-surface-1)]',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface LuxuryCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof luxuryCardVariants> {
  /** Enable hover animation */
  animated?: boolean;
}

const LuxuryCard = forwardRef<HTMLDivElement, LuxuryCardProps>(
  ({ className, variant, size, animated = false, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    // Use motion.div for animated cards
    if (animated && !prefersReducedMotion) {
      return (
        <motion.div
          ref={ref}
          className={cn(luxuryCardVariants({ variant, size }), className)}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          variants={cardHover}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(luxuryCardVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LuxuryCard.displayName = 'LuxuryCard';

// Card Header
interface LuxuryCardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const LuxuryCardHeader = forwardRef<HTMLDivElement, LuxuryCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);

LuxuryCardHeader.displayName = 'LuxuryCardHeader';

// Card Title
interface LuxuryCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const LuxuryCardTitle = forwardRef<HTMLHeadingElement, LuxuryCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-xl font-medium text-[var(--business-text-primary)] tracking-tight',
        className
      )}
      style={{ fontFamily: 'var(--business-font-display)' }}
      {...props}
    />
  )
);

LuxuryCardTitle.displayName = 'LuxuryCardTitle';

// Card Description
interface LuxuryCardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {}

const LuxuryCardDescription = forwardRef<
  HTMLParagraphElement,
  LuxuryCardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-[var(--business-text-secondary)]',
      className
    )}
    style={{ fontFamily: 'var(--business-font-body)' }}
    {...props}
  />
));

LuxuryCardDescription.displayName = 'LuxuryCardDescription';

// Card Content
interface LuxuryCardContentProps extends HTMLAttributes<HTMLDivElement> {}

const LuxuryCardContent = forwardRef<HTMLDivElement, LuxuryCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

LuxuryCardContent.displayName = 'LuxuryCardContent';

// Card Footer
interface LuxuryCardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const LuxuryCardFooter = forwardRef<HTMLDivElement, LuxuryCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);

LuxuryCardFooter.displayName = 'LuxuryCardFooter';

export {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  LuxuryCardFooter,
  luxuryCardVariants,
};
