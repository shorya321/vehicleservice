import {
  EXPIRED_BOOKING_NOTE,
  customerActionsClosed,
  customerPaymentBlockedReason,
  customerStatusBlockedReason,
  customerTripPaidBlockedReason,
  TRIP_JOURNEY_CANCELLED_NOTE,
  type CustomerBookingState,
} from '@/lib/bookings/admin-booking-rules'

const state = (booking_status: string, payment_status: string, payment_expired_at: string | null = null): CustomerBookingState => ({
  booking_status,
  payment_status,
  payment_expired_at,
})

const awaiting = state('pending', 'processing')
const paidPending = state('pending', 'completed')
const confirmedPaid = state('confirmed', 'completed')
const cancelledPaid = state('cancelled', 'completed')
const cancelledUnpaid = state('cancelled', 'processing')
const refunded = state('cancelled', 'refunded')
const expired = state('cancelled', 'processing', '2026-11-04T09:31:59Z')
const completedTrip = state('completed', 'completed')

describe('customerStatusBlockedReason', () => {
  it('confirms only a pending booking that is paid', () => {
    expect(customerStatusBlockedReason(paidPending, 'confirmed')).toBeNull()
    expect(customerStatusBlockedReason(awaiting, 'confirmed')).toBe('Mark the booking paid before confirming it.')
    expect(customerStatusBlockedReason(cancelledPaid, 'confirmed')).toBe('Only a pending booking can be confirmed.')
    expect(customerStatusBlockedReason(completedTrip, 'confirmed')).toBe('Only a pending booking can be confirmed.')
  })

  it('completes only a confirmed booking', () => {
    expect(customerStatusBlockedReason(confirmedPaid, 'completed')).toBeNull()
    expect(customerStatusBlockedReason(awaiting, 'completed')).not.toBeNull()
    expect(customerStatusBlockedReason(cancelledPaid, 'completed')).not.toBeNull()
  })

  it('cancels only a pending or confirmed booking', () => {
    expect(customerStatusBlockedReason(awaiting, 'cancelled')).toBeNull()
    expect(customerStatusBlockedReason(confirmedPaid, 'cancelled')).toBeNull()
    expect(customerStatusBlockedReason(completedTrip, 'cancelled')).not.toBeNull()
    expect(customerStatusBlockedReason(cancelledUnpaid, 'cancelled')).not.toBeNull()
  })

  it('allows nothing on an expired or refunded booking', () => {
    for (const to of ['confirmed', 'completed', 'cancelled'] as const) {
      expect(customerStatusBlockedReason(expired, to)).toBe(EXPIRED_BOOKING_NOTE)
      expect(customerStatusBlockedReason(refunded, to)).toBe('This booking was refunded.')
    }
  })
})

describe('customerPaymentBlockedReason', () => {
  it('marks paid only a pending booking still waiting for payment', () => {
    expect(customerPaymentBlockedReason(awaiting, 'completed')).toBeNull()
    expect(customerPaymentBlockedReason(state('pending', 'pending'), 'completed')).toBeNull()
    expect(customerPaymentBlockedReason(cancelledUnpaid, 'completed')).not.toBeNull()
    expect(customerPaymentBlockedReason(state('pending', 'failed'), 'completed')).not.toBeNull()
    expect(customerPaymentBlockedReason(expired, 'completed')).toBe(EXPIRED_BOOKING_NOTE)
  })

  it('records a refund only for a paid booking that was cancelled', () => {
    expect(customerPaymentBlockedReason(cancelledPaid, 'refunded')).toBeNull()
    expect(customerPaymentBlockedReason(confirmedPaid, 'refunded')).toBe('Cancel the booking before marking it refunded.')
    expect(customerPaymentBlockedReason(cancelledUnpaid, 'refunded')).toBe('Only a paid booking can be marked refunded.')
    expect(customerPaymentBlockedReason(expired, 'refunded')).toBe(EXPIRED_BOOKING_NOTE)
    expect(customerPaymentBlockedReason(refunded, 'refunded')).toBe('This booking was refunded.')
  })

  it('never offers Failed for a customer booking', () => {
    expect(customerPaymentBlockedReason(awaiting, 'failed')).not.toBeNull()
    expect(customerPaymentBlockedReason(confirmedPaid, 'failed')).not.toBeNull()
  })
})

describe('customerActionsClosed', () => {
  it('is closed only for expired or refunded bookings', () => {
    expect(customerActionsClosed(expired)).toBe(true)
    expect(customerActionsClosed(refunded)).toBe(true)
    expect(customerActionsClosed(awaiting)).toBe(false)
    expect(customerActionsClosed(cancelledPaid)).toBe(false)
  })
})

describe('customerTripPaidBlockedReason', () => {
  it('allows Paid on a trip only while every journey is pending', () => {
    expect(customerTripPaidBlockedReason([{ booking_status: 'pending' }, { booking_status: 'pending' }])).toBeNull()
    expect(customerTripPaidBlockedReason([{ booking_status: 'pending' }, { booking_status: 'cancelled' }])).toBe(TRIP_JOURNEY_CANCELLED_NOTE)
    expect(customerTripPaidBlockedReason([{ booking_status: 'confirmed' }, { booking_status: 'pending' }])).toBe(TRIP_JOURNEY_CANCELLED_NOTE)
    expect(customerTripPaidBlockedReason([])).toBe('Booking not found')
  })
})
