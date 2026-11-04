/**
 * Which admin status and payment changes a customer booking may take. Used by the
 * booking detail page, the list row menu and the server actions, so the buttons
 * and the server always agree. Business bookings have their own rules
 * (lib/business/booking-guards.ts) and never come through here.
 *
 * Refund is a status record only: the system moves no money for a customer refund.
 */

export interface CustomerBookingState {
  booking_status: string | null | undefined
  payment_status: string | null | undefined
  payment_expired_at?: string | null
}

export type AdminStatusTarget = 'confirmed' | 'completed' | 'cancelled'
export type AdminPaymentTarget = 'completed' | 'failed' | 'refunded'

export const EXPIRED_BOOKING_NOTE = 'Closed automatically: payment was not completed in time.'
const REFUNDED_NOTE = 'This booking was refunded.'

/** Null when the change is allowed, otherwise the reason to show. */
export function customerStatusBlockedReason(state: CustomerBookingState, to: AdminStatusTarget): string | null {
  if (state.payment_expired_at) return EXPIRED_BOOKING_NOTE
  if (state.payment_status === 'refunded') return REFUNDED_NOTE

  switch (to) {
    case 'confirmed':
      if (state.booking_status !== 'pending') return 'Only a pending booking can be confirmed.'
      if (state.payment_status !== 'completed') return 'Mark the booking paid before confirming it.'
      return null
    case 'completed':
      return state.booking_status === 'confirmed' ? null : 'Only a confirmed booking can be completed.'
    case 'cancelled':
      return state.booking_status === 'pending' || state.booking_status === 'confirmed'
        ? null
        : 'Only a pending or confirmed booking can be cancelled.'
  }
}

/** Null when the change is allowed, otherwise the reason to show. */
export function customerPaymentBlockedReason(state: CustomerBookingState, to: AdminPaymentTarget): string | null {
  if (state.payment_expired_at) return EXPIRED_BOOKING_NOTE
  if (state.payment_status === 'refunded') return REFUNDED_NOTE

  switch (to) {
    case 'completed':
      return state.booking_status === 'pending' &&
        (state.payment_status === 'pending' || state.payment_status === 'processing')
        ? null
        : 'Only a booking waiting for payment can be marked paid.'
    case 'refunded':
      if (state.payment_status !== 'completed') return 'Only a paid booking can be marked refunded.'
      if (state.booking_status !== 'cancelled') return 'Cancel the booking before marking it refunded.'
      return null
    case 'failed':
      return 'Failed is not used for customer bookings.'
  }
}

export const TRIP_JOURNEY_CANCELLED_NOTE = 'A journey of this trip is cancelled, so it cannot be marked paid.'

/**
 * Manual "Paid" on a round trip or multi-city trip covers the whole trip, so every
 * journey must still be pending. One cancelled journey blocks it.
 */
export function customerTripPaidBlockedReason(legs: ReadonlyArray<{ booking_status: string | null | undefined }>): string | null {
  if (legs.length === 0) return 'Booking not found'
  return legs.every((leg) => leg.booking_status === 'pending') ? null : TRIP_JOURNEY_CANCELLED_NOTE
}

/** True when no admin status or payment action applies at all (the panel shows a note instead). */
export function customerActionsClosed(state: CustomerBookingState): boolean {
  return Boolean(state.payment_expired_at) || state.payment_status === 'refunded'
}
