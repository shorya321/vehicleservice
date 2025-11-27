/**
 * Luxury Button Component
 * Premium buttons with glow effects and animations
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buttonPress } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Loader2 } from 'lucide-react';

const luxuryButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--business-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--business-surface-0)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-[var(--business-primary-600)] to-[var(--business-primary-500)] text-white hover:from-[var(--business-primary-500)] hover:to-[var(--business-primary-400)] shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]',
        secondary:
          'border border-[var(--business-primary-500)]/50 bg-transparent text-[var(--business-primary-400)] hover:bg-[var(--business-primary-500)]/10 hover:border-[var(--business-primary-400)]',
        ghost:
          'text-[var(--business-text-secondary)] hover:bg-[var(--business-primary-500)]/10 hover:text-[var(--business-text-primary)]',
        outline:
          'border border-[var(--business-border-default)] bg-transparent text-[var(--business-text-primary)] hover:bg-[var(--business-primary-500)]/10 hover:border-[var(--business-primary-500)]/50',
        destructive:
          'bg-[var(--business-error)]/10 text-[var(--business-error)] border border-[var(--business-error)]/30 hover:bg-[var(--business-error)]/20 hover:border-[var(--business-error)]/50',
        link:
          'text-[var(--business-primary-400)] underline-offset-4 hover:underline',
        premium:
          'bg-gradient-to-r from-[var(--business-primary-500)] via-[var(--business-primary-400)] to-[var(--business-secondary-400)] text-white font-semibold shadow-[0_0_20px_-4px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_-4px_rgba(99,102,241,0.6)]',
        success:
          'bg-[var(--business-success)]/10 text-[var(--business-success)] border border-[var(--business-success)]/30 hover:bg-[var(--business-success)]/20 hover:border-[var(--business-success)]/50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface LuxuryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof luxuryButtonVariants> {
  /** Show loading spinner */
  isLoading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Enable press animation */
  animated?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Render as child component (for Links) */
  asChild?: boolean;
}

const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      animated = true,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const isDisabled = disabled || isLoading;

    const content = (
      <>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </>
    );

    // When asChild is true, use Slot to merge props with child
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(luxuryButtonVariants({ variant, size }), className)}
          style={{ fontFamily: 'var(--business-font-body)' }}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    // Use motion.button for animated buttons
    if (animated && !prefersReducedMotion && !isDisabled) {
      return (
        <motion.button
          ref={ref}
          className={cn(luxuryButtonVariants({ variant, size }), className)}
          disabled={isDisabled}
          style={{ fontFamily: 'var(--business-font-body)' }}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          variants={buttonPress}
          {...(props as HTMLMotionProps<'button'>)}
        >
          {content}
        </motion.button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(luxuryButtonVariants({ variant, size }), className)}
        disabled={isDisabled}
        style={{ fontFamily: 'var(--business-font-body)' }}
        {...props}
      >
        {content}
      </button>
    );
  }
);

LuxuryButton.displayName = 'LuxuryButton';

// Icon Button variant
interface LuxuryIconButtonProps extends Omit<LuxuryButtonProps, 'size'> {
  size?: 'sm' | 'default' | 'lg';
}

const LuxuryIconButton = forwardRef<HTMLButtonElement, LuxuryIconButtonProps>(
  ({ size = 'default', ...props }, ref) => {
    const sizeMap = {
      sm: 'icon-sm',
      default: 'icon',
      lg: 'icon-lg',
    } as const;

    return <LuxuryButton ref={ref} size={sizeMap[size]} {...props} />;
  }
);

LuxuryIconButton.displayName = 'LuxuryIconButton';

export { LuxuryButton, LuxuryIconButton, luxuryButtonVariants };
