/**
 * A customer may review a trip they own, paid for and have travelled.
 * booking_status rarely reaches "completed", so the clock decides travelled,
 * and a round trip or multi-city trip is reviewed once, on its first journey.
 */
import { isReviewEligible, type ReviewableBooking } from '@/lib/reviews/eligibility'

const NOW = new Date('2026-11-16T10:00:00Z')
const USER = 'user-1'

const PAID_PAST: ReviewableBooking = {
  customer_id: USER,
  booking_status: 'confirmed',
  payment_status: 'completed',
  pickup_datetime: '2026-11-15T08:00:00Z',
  booking_group_id: null,
  leg_index: null,
}

describe('isReviewEligible', () => {
  it('allows a paid trip the customer owns once pickup has passed', () => {
    expect(isReviewEligible(PAID_PAST, USER, NOW)).toEqual({ can: true })
  })

  it('does not need booking_status to be completed', () => {
    expect(isReviewEligible({ ...PAID_PAST, booking_status: 'pending' }, USER, NOW).can).toBe(true)
  })

  it('allows the first journey of a grouped trip', () => {
    const leg0 = { ...PAID_PAST, booking_group_id: 'g-1', leg_index: 0 }
    expect(isReviewEligible(leg0, USER, NOW).can).toBe(true)
  })

  it.each([
    ['another customer', { customer_id: 'user-2' }],
    ['a guest booking', { customer_id: null }],
    ['a cancelled trip', { booking_status: 'cancelled' }],
    ['an unpaid trip', { payment_status: 'pending' }],
    ['a payment still processing', { payment_status: 'processing' }],
    ['a refunded trip', { payment_status: 'refunded' }],
    ['a pickup still ahead', { pickup_datetime: '2026-11-16T12:00:00Z' }],
    ['a pickup at this exact moment', { pickup_datetime: NOW.toISOString() }],
    ['an unreadable pickup time', { pickup_datetime: 'not a date' }],
    ['the second journey of a grouped trip', { booking_group_id: 'g-1', leg_index: 1 }],
  ])('refuses %s with a reason', (_label, change) => {
    const result = isReviewEligible({ ...PAID_PAST, ...change } as ReviewableBooking, USER, NOW)
    expect(result.can).toBe(false)
    expect(result.reason).toEqual(expect.any(String))
  })
})
