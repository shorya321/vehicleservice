import { StatusPill, type StatusTone } from '@/components/admin/ui/status-pill'
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DirectBookingPaymentStatus,
  type DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'

/** Offline booking statuses mapped onto the portal's shared pill tones. */
const BOOKING_TONES: Record<DirectBookingStatus, StatusTone> = {
  pending: 'pending',
  confirmed: 'success',
  in_progress: 'info',
  completed: 'success-strong',
  cancelled: 'danger',
}

const PAYMENT_TONES: Record<DirectBookingPaymentStatus, StatusTone> = {
  unpaid: 'warning',
  partial: 'warning',
  paid: 'success-soft',
  refunded: 'refund',
}

export function BookingStatusBadge({ status }: { status: string }) {
  const key = status as DirectBookingStatus
  const label = BOOKING_STATUS_LABELS[key]

  // Guard the unknown case: a value added in the database but not yet here
  // should render as-is rather than crash the row.
  if (!label) return <StatusPill tone="neutral">{status || 'Unknown'}</StatusPill>

  return <StatusPill tone={BOOKING_TONES[key]}>{label}</StatusPill>
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const key = status as DirectBookingPaymentStatus
  const label = PAYMENT_STATUS_LABELS[key]

  if (!label) return <StatusPill tone="neutral">{status || 'Unknown'}</StatusPill>

  return <StatusPill tone={PAYMENT_TONES[key]}>{label}</StatusPill>
}
