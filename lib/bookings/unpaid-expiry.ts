/**
 * Unpaid checkout rules, shared by the payment page, the admin labels and tests.
 *
 * Checkout saves a customer booking as booking_status 'pending' + payment_status
 * 'processing' before the card form. The database job expire_unpaid_bookings()
 * closes the ones left unpaid past the admin's limit and stamps
 * payment_expired_at. The payment page applies the same age rule itself, so
 * nothing stays payable when the job is late or paused.
 */

export interface UnpaidExpirySettings {
  enabled: boolean
  minutes: number
}

export const UNPAID_EXPIRY_MIN_MINUTES = 15
export const UNPAID_EXPIRY_MAX_MINUTES = 1440

export const DEFAULT_UNPAID_EXPIRY: UnpaidExpirySettings = { enabled: true, minutes: 60 }

export interface CheckoutState {
  bookingStatus: string | null | undefined
  paymentStatus: string | null | undefined
  paymentExpiredAt?: string | null
  createdAt?: string | null
}

/** True while the customer started checkout and has not paid: the only state the job expires. */
export function isAwaitingPayment(state: CheckoutState): boolean {
  return state.bookingStatus === 'pending' && state.paymentStatus === 'processing' && !state.paymentExpiredAt
}

/**
 * True when an unpaid booking must no longer be offered a card form: it was
 * cancelled, refunded or expired, or it has sat unpaid past the limit. A paid
 * booking is never "closed" here; callers redirect those to confirmation first.
 */
export function isCheckoutClosed(
  state: CheckoutState,
  settings: UnpaidExpirySettings,
  now: Date = new Date()
): boolean {
  if (state.paymentStatus === 'completed') return false
  if (state.bookingStatus === 'cancelled' || state.bookingStatus === 'refunded') return true
  if (state.paymentExpiredAt) return true
  if (!settings.enabled || !isAwaitingPayment(state) || !state.createdAt) return false

  const created = new Date(state.createdAt).getTime()
  if (!Number.isFinite(created)) return false
  return now.getTime() - created >= settings.minutes * 60_000
}

export const UNPAID_ASSIGN_BLOCKED_REASON = 'A vendor can be assigned once the customer has paid.'

/**
 * Customer bookings are only offered to vendors once paid; an unpaid checkout may
 * never turn into a trip. Business bookings are paid from the wallet up front and
 * are not affected. Returns the reason to show, or null when assigning is allowed.
 */
export function vendorAssignBlockedReason(
  bookingType: 'customer' | 'business' | undefined,
  paymentStatus: string | null | undefined
): string | null {
  if (bookingType === 'business') return null
  return paymentStatus === 'completed' ? null : UNPAID_ASSIGN_BLOCKED_REASON
}

/** The fields an admin list row needs to label its payment. */
export interface PaymentBadgeRow {
  bookingType?: 'customer' | 'business'
  booking_status?: string | null
  payment_expired_at?: string | null
}

/** Admin label for a customer booking's payment. Business bookings keep their own labels. */
export function customerPaymentLabel(state: CheckoutState): string {
  if (state.paymentStatus === 'completed') return 'Paid'
  if (state.paymentExpiredAt) return 'Expired (unpaid)'
  if (state.bookingStatus === 'pending' && (state.paymentStatus === 'processing' || state.paymentStatus === 'pending')) {
    return 'Awaiting payment'
  }
  // Cancelled before any payment arrived: nothing is still being processed.
  if (state.bookingStatus === 'cancelled' && (state.paymentStatus === 'processing' || state.paymentStatus === 'pending')) {
    return 'Not paid'
  }
  const raw = (state.paymentStatus ?? '').replace(/_/g, ' ')
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Unknown'
}

/** Clamp and validate whatever the settings row holds. */
export function normaliseUnpaidExpiry(row: { expire_unpaid_enabled?: unknown; expire_unpaid_minutes?: unknown } | null | undefined): UnpaidExpirySettings {
  if (!row) return DEFAULT_UNPAID_EXPIRY
  const minutes = Number(row.expire_unpaid_minutes)
  return {
    enabled: typeof row.expire_unpaid_enabled === 'boolean' ? row.expire_unpaid_enabled : DEFAULT_UNPAID_EXPIRY.enabled,
    minutes:
      Number.isInteger(minutes) && minutes >= UNPAID_EXPIRY_MIN_MINUTES && minutes <= UNPAID_EXPIRY_MAX_MINUTES
        ? minutes
        : DEFAULT_UNPAID_EXPIRY.minutes,
  }
}
