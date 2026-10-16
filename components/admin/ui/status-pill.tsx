import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Solid status pill for the admin and vendor portals.
 *
 * Colours live in app/admin/globals.css (.status-pill--*), with a .light
 * counterpart for each tone, so the pill follows the portal theme without
 * relying on Tailwind's dark: variant. Admin and vendor only: the business
 * module keeps its own badges.
 */
export type StatusTone =
  | 'success'
  | 'success-strong'
  | 'success-soft'
  | 'pending'
  | 'warning'
  | 'info'
  | 'refund'
  | 'danger'
  | 'danger-outline'
  | 'neutral'

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone
}

export function StatusPill({ tone, className, children, ...props }: StatusPillProps): React.JSX.Element {
  return (
    <span className={cn('status-pill', `status-pill--${tone}`, className)} {...props}>
      {children}
    </span>
  )
}

const BOOKING_STATUS_TONES: Record<string, StatusTone> = {
  confirmed: 'success',
  completed: 'success-strong',
  pending: 'pending',
  in_progress: 'info',
  cancelled: 'danger',
}

const PAYMENT_STATUS_TONES: Record<string, StatusTone> = {
  completed: 'success-soft',
  paid: 'success-soft',
  pending: 'warning',
  processing: 'info',
  refunded: 'refund',
  partially_refunded: 'refund',
  failed: 'danger-outline',
}

const ASSIGNMENT_STATUS_TONES: Record<string, StatusTone> = {
  pending: 'warning',
  accepted: 'success-soft',
  completed: 'success-soft',
  rejected: 'danger-outline',
  cancelled: 'danger-outline',
}

export function bookingStatusTone(status: string | null | undefined): StatusTone {
  return BOOKING_STATUS_TONES[status ?? ''] ?? 'neutral'
}

export function paymentStatusTone(status: string | null | undefined): StatusTone {
  return PAYMENT_STATUS_TONES[status ?? ''] ?? 'neutral'
}

export function assignmentStatusTone(status: string | null | undefined): StatusTone {
  return ASSIGNMENT_STATUS_TONES[status ?? ''] ?? 'neutral'
}

/** "in_progress" -> "In progress" */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  const words = status.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
