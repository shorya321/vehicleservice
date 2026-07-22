import { Badge } from '@/components/ui/badge'
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DirectBookingPaymentStatus,
  type DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'

/**
 * Local badge mappers, matching how every other list in this codebase does it —
 * there is no shared StatusBadge component, and inventing one here would mean
 * reconciling ten slightly different existing mappings.
 */

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

const BOOKING_VARIANTS: Record<DirectBookingStatus, BadgeVariant> = {
  pending: 'outline',
  confirmed: 'default',
  in_progress: 'warning',
  completed: 'secondary',
  cancelled: 'destructive',
}

const PAYMENT_VARIANTS: Record<DirectBookingPaymentStatus, BadgeVariant> = {
  unpaid: 'outline',
  partial: 'warning',
  paid: 'success',
  refunded: 'secondary',
}

export function BookingStatusBadge({ status }: { status: string }) {
  const key = status as DirectBookingStatus
  const label = BOOKING_STATUS_LABELS[key]

  // Guard the unknown case: a value added in the database but not yet here
  // should render as-is rather than crash the row.
  if (!label) return <Badge variant="outline">{status || 'Unknown'}</Badge>

  return <Badge variant={BOOKING_VARIANTS[key]}>{label}</Badge>
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const key = status as DirectBookingPaymentStatus
  const label = PAYMENT_STATUS_LABELS[key]

  if (!label) return <Badge variant="outline">{status || 'Unknown'}</Badge>

  return <Badge variant={PAYMENT_VARIANTS[key]}>{label}</Badge>
}
