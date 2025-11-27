/**
 * Luxury Input Component
 * Premium form inputs with enhanced focus and glow effects
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const luxuryInputVariants = cva(
  'w-full rounded-xl font-[family-name:var(--business-font-body)] transition-all duration-200 placeholder:text-[var(--business-text-muted)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--business-surface-3)] border border-[var(--business-border-default)] text-[var(--business-text-primary)] focus:border-[var(--business-primary-500)] focus:ring-2 focus:ring-[var(--business-primary-500)]/20 focus:outline-none hover:border-[var(--business-primary-500)]/40',
        filled:
          'bg-[var(--business-surface-2)] border-transparent text-[var(--business-text-primary)] focus:bg-[var(--business-surface-3)] focus:border-[var(--business-primary-500)] focus:ring-2 focus:ring-[var(--business-primary-500)]/20 focus:outline-none',
        ghost:
          'bg-transparent border-b border-[var(--business-border-default)] rounded-none text-[var(--business-text-primary)] focus:border-[var(--business-primary-500)] focus:outline-none px-0',
      },
      inputSize: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-11 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface LuxuryInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof luxuryInputVariants> {
  /** Left icon or element */
  leftIcon?: ReactNode;
  /** Right icon or element */
  rightIcon?: ReactNode;
  /** Error state */
  isError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Wrapper className */
  wrapperClassName?: string;
}

const LuxuryInput = forwardRef<HTMLInputElement, LuxuryInputProps>(
  (
    {
      className,
      variant,
      inputSize,
      leftIcon,
      rightIcon,
      isError,
      errorMessage,
      wrapperClassName,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn('relative', wrapperClassName)}>
        {/* Left Icon */}
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--business-text-muted)]">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          ref={ref}
          className={cn(
            luxuryInputVariants({ variant, inputSize }),
            hasLeftIcon && 'pl-10',
            hasRightIcon && 'pr-10',
            isError &&
              'border-[var(--business-error)]/50 focus:border-[var(--business-error)] focus:ring-[var(--business-error)]/15',
            className
          )}
          {...props}
        />

        {/* Right Icon */}
        {hasRightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--business-text-muted)]">
            {rightIcon}
          </div>
        )}

        {/* Error Message */}
        {isError && errorMessage && (
          <p className="mt-1.5 text-xs text-[var(--business-error)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

LuxuryInput.displayName = 'LuxuryInput';

// Textarea variant
export interface LuxuryTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'size'
  >,
    VariantProps<typeof luxuryInputVariants> {
  /** Error state */
  isError?: boolean;
  /** Error message */
  errorMessage?: string;
}

const LuxuryTextarea = forwardRef<HTMLTextAreaElement, LuxuryTextareaProps>(
  (
    { className, variant, inputSize, isError, errorMessage, ...props },
    ref
  ) => {
    return (
      <div className="relative">
        <textarea
          ref={ref}
          className={cn(
            luxuryInputVariants({ variant }),
            'min-h-[100px] py-3 resize-none',
            inputSize === 'sm' && 'text-xs px-3',
            inputSize === 'default' && 'text-sm px-4',
            inputSize === 'lg' && 'text-base px-4',
            isError &&
              'border-[var(--business-error)]/50 focus:border-[var(--business-error)] focus:ring-[var(--business-error)]/15',
            className
          )}
          {...props}
        />

        {/* Error Message */}
        {isError && errorMessage && (
          <p className="mt-1.5 text-xs text-[var(--business-error)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

LuxuryTextarea.displayName = 'LuxuryTextarea';

// Label component
interface LuxuryLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Required indicator */
  required?: boolean;
}

const LuxuryLabel = forwardRef<HTMLLabelElement, LuxuryLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-[var(--business-text-secondary)] mb-1.5 font-[family-name:var(--business-font-body)]',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-[var(--business-primary-400)] ml-1">*</span>}
      </label>
    );
  }
);

LuxuryLabel.displayName = 'LuxuryLabel';

// Form Group - combines label and input
interface LuxuryFormGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

const LuxuryFormGroup = ({
  label,
  required,
  error,
  hint,
  children,
  className,
}: LuxuryFormGroupProps) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <LuxuryLabel required={required}>{label}</LuxuryLabel>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--business-text-muted)]">{hint}</p>
      )}
      {error && <p className="text-xs text-[var(--business-error)]">{error}</p>}
    </div>
  );
};

export {
  LuxuryInput,
  LuxuryTextarea,
  LuxuryLabel,
  LuxuryFormGroup,
  luxuryInputVariants,
};
