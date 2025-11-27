/**
 * Status Badge Component
 * Premium badges with dot indicators and pulse animations
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium text-xs px-2.5 py-1',
  {
    variants: {
      variant: {
        default: 'bg-[var(--business-surface-3)] text-[var(--business-text-secondary)]',
        pending: 'bg-[var(--business-warning)]/15 text-[var(--business-warning)]',
        confirmed: 'bg-[var(--business-success)]/15 text-[var(--business-success)]',
        'in-progress': 'bg-[var(--business-info)]/15 text-[var(--business-info)]',
        completed: 'bg-[var(--business-primary-500)]/15 text-[var(--business-primary-400)]',
        cancelled: 'bg-[var(--business-error)]/15 text-[var(--business-error)]',
        draft: 'bg-[var(--business-surface-3)] text-[var(--business-text-muted)]',
        active: 'bg-[var(--business-success)]/15 text-[var(--business-success)]',
        inactive: 'bg-[var(--business-surface-3)] text-[var(--business-text-muted)]',
        frozen: 'bg-[var(--business-info)]/15 text-[var(--business-info)]',
        warning: 'bg-[var(--business-warning)]/15 text-[var(--business-warning)]',
        success: 'bg-[var(--business-success)]/15 text-[var(--business-success)]',
        error: 'bg-[var(--business-error)]/15 text-[var(--business-error)]',
        info: 'bg-[var(--business-info)]/15 text-[var(--business-info)]',
        // Payment specific
        paid: 'bg-[var(--business-success)]/15 text-[var(--business-success)]',
        unpaid: 'bg-[var(--business-error)]/15 text-[var(--business-error)]',
        refunded: 'bg-purple-500/15 text-purple-400',
        'partially-paid': 'bg-[var(--business-warning)]/15 text-[var(--business-warning)]',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        default: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const dotColorMap: Record<string, string> = {
  default: 'bg-[var(--business-text-muted)]',
  pending: 'bg-[var(--business-warning)]',
  confirmed: 'bg-[var(--business-success)]',
  'in-progress': 'bg-[var(--business-info)]',
  completed: 'bg-[var(--business-primary-400)]',
  cancelled: 'bg-[var(--business-error)]',
  draft: 'bg-[var(--business-text-muted)]',
  active: 'bg-[var(--business-success)]',
  inactive: 'bg-[var(--business-text-muted)]',
  frozen: 'bg-[var(--business-info)]',
  warning: 'bg-[var(--business-warning)]',
  success: 'bg-[var(--business-success)]',
  error: 'bg-[var(--business-error)]',
  info: 'bg-[var(--business-info)]',
  paid: 'bg-[var(--business-success)]',
  unpaid: 'bg-[var(--business-error)]',
  refunded: 'bg-purple-400',
  'partially-paid': 'bg-[var(--business-warning)]',
};

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show dot indicator */
  showDot?: boolean;
  /** Animate the dot (pulse) */
  pulseDot?: boolean;
  /** Custom dot color */
  dotColor?: string;
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      className,
      variant,
      size,
      showDot = true,
      pulseDot = false,
      dotColor,
      children,
      ...props
    },
    ref
  ) => {
    const dotBgColor = dotColor || dotColorMap[variant || 'default'];

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size }), className)}
        style={{ fontFamily: 'var(--business-font-body)' }}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              dotBgColor,
              pulseDot && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Booking status badge with preset labels
type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface BookingStatusBadgeProps
  extends Omit<StatusBadgeProps, 'variant' | 'children'> {
  status: BookingStatus;
}

const BookingStatusBadge = ({
  status,
  pulseDot,
  ...props
}: BookingStatusBadgeProps) => {
  // Auto-pulse for in-progress status
  const shouldPulse = pulseDot ?? status === 'in-progress';

  return (
    <StatusBadge variant={status} pulseDot={shouldPulse} {...props}>
      {bookingStatusLabels[status]}
    </StatusBadge>
  );
};

// Payment status badge
type PaymentStatus = 'paid' | 'unpaid' | 'refunded' | 'partially-paid';

const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
  'partially-paid': 'Partial',
};

interface PaymentStatusBadgeProps
  extends Omit<StatusBadgeProps, 'variant' | 'children'> {
  status: PaymentStatus;
}

const PaymentStatusBadge = ({ status, ...props }: PaymentStatusBadgeProps) => {
  return (
    <StatusBadge variant={status} {...props}>
      {paymentStatusLabels[status]}
    </StatusBadge>
  );
};

// Account status badge
type AccountStatus = 'active' | 'inactive' | 'frozen';

const accountStatusLabels: Record<AccountStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  frozen: 'Frozen',
};

interface AccountStatusBadgeProps
  extends Omit<StatusBadgeProps, 'variant' | 'children'> {
  status: AccountStatus;
}

const AccountStatusBadge = ({ status, ...props }: AccountStatusBadgeProps) => {
  return (
    <StatusBadge variant={status} {...props}>
      {accountStatusLabels[status]}
    </StatusBadge>
  );
};

export {
  StatusBadge,
  BookingStatusBadge,
  PaymentStatusBadge,
  AccountStatusBadge,
  statusBadgeVariants,
};
