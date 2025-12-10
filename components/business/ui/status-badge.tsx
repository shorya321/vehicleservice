/**
 * Status Badge Component
 * Premium badges with dot indicators and pulse animations
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium text-xs px-2.5 py-1 border',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground border-border',
        pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        confirmed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        'in-progress': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        draft: 'bg-muted text-muted-foreground border-border',
        active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        inactive: 'bg-muted text-muted-foreground border-border',
        frozen: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        // Payment specific
        paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        unpaid: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        refunded: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        'partially-paid': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
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
  default: 'bg-muted-foreground/40',
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  'in-progress': 'bg-sky-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  draft: 'bg-muted-foreground/40',
  active: 'bg-emerald-500',
  inactive: 'bg-muted-foreground/40',
  frozen: 'bg-sky-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
  paid: 'bg-emerald-500',
  unpaid: 'bg-red-500',
  refunded: 'bg-sky-500',
  'partially-paid': 'bg-amber-500',
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
        role="status"
        aria-label={`Status: ${children}`}
        className={cn(statusBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              dotBgColor,
              pulseDot && 'animate-pulse'
            )}
            aria-hidden="true"
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
