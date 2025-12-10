/**
 * Luxury Card Component
 * Premium card variants with CVA styling using semantic CSS variables
 *
 * Design System: Clean shadcn with Gold Accent
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
  'rounded-xl border transition-all',
  {
    variants: {
      variant: {
        default:
          'border-border bg-card',
        hero:
          'border-primary/30 bg-card shadow-lg',
        interactive:
          'border-border bg-card cursor-pointer hover:border-primary/40 hover:shadow-md hover:-translate-y-1',
        stat:
          'border-border bg-card/80',
        elevated:
          'border-border bg-card shadow-md',
        glass:
          'border-border bg-card/80 backdrop-blur-sm',
        gradient:
          'border-primary/20 bg-gradient-to-br from-primary/5 to-card',
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
        'text-xl font-medium text-card-foreground tracking-tight',
        className
      )}
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
      'text-sm text-muted-foreground',
      className
    )}
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
