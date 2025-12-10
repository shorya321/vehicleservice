/**
 * Luxury Button Component
 * Premium buttons using semantic CSS variables
 *
 * Design System: Clean shadcn with Gold Accent
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
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm hover:shadow-md',
        secondary:
          'border border-border bg-transparent text-primary hover:bg-primary/10 hover:border-primary/30',
        ghost:
          'text-muted-foreground hover:bg-muted hover:text-foreground',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted hover:border-border',
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15 hover:border-destructive/30',
        link:
          'text-primary underline-offset-4 hover:underline',
        premium:
          'bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:bg-primary/90',
        success:
          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30',
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
