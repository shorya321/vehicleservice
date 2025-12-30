'use client';

/**
 * Business Portal Luxury Alert Component
 * Premium styled alert/notification banners with business design tokens
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const luxuryAlertVariants = cva(
  [
    'relative w-full rounded-[var(--business-radius-lg)] p-4',
    'border',
    'flex items-start gap-3',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--business-surface-2)]',
          'border-[var(--business-border-default)]',
          'text-[var(--business-text-primary)]',
        ].join(' '),
        info: [
          'bg-[var(--business-info)]/10',
          'border-[var(--business-info)]/30',
          'text-[var(--business-info)]',
        ].join(' '),
        success: [
          'bg-[var(--business-success)]/10',
          'border-[var(--business-success)]/30',
          'text-[var(--business-success)]',
        ].join(' '),
        warning: [
          'bg-[var(--business-warning)]/10',
          'border-[var(--business-warning)]/30',
          'text-[var(--business-warning)]',
        ].join(' '),
        error: [
          'bg-[var(--business-error)]/10',
          'border-[var(--business-error)]/30',
          'text-[var(--business-error)]',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

interface LuxuryAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof luxuryAlertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const LuxuryAlert = React.forwardRef<HTMLDivElement, LuxuryAlertProps>(
  (
    {
      className,
      variant = 'default',
      title,
      children,
      dismissible,
      onDismiss,
      icon,
      ...props
    },
    ref
  ) => {
    const IconComponent = iconMap[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(luxuryAlertVariants({ variant }), className)}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || <IconComponent className="h-5 w-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {title && (
            <h5 className="font-business-display font-medium leading-none tracking-tight">
              {title}
            </h5>
          )}
          {children && (
            <div
              className={cn(
                'font-business-body text-sm',
                variant === 'default'
                  ? 'text-[var(--business-text-muted)]'
                  : 'opacity-90'
              )}
            >
              {children}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 rounded-[var(--business-radius-md)] p-1',
              'hover:bg-muted/50',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-current'
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
LuxuryAlert.displayName = 'LuxuryAlert';

export { LuxuryAlert, luxuryAlertVariants };
