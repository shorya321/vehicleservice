import {
  DEFAULT_UNPAID_EXPIRY,
  UNPAID_ASSIGN_BLOCKED_REASON,
  customerPaymentLabel,
  isAwaitingPayment,
  isCheckoutClosed,
  normaliseUnpaidExpiry,
  vendorAssignBlockedReason,
} from '@/lib/bookings/unpaid-expiry'
import { bookingAutomationSchema } from '@/lib/bookings/automation-schema'

const NOW = new Date('2026-11-04T12:00:00Z')
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString()
const unpaid = (createdMinutesAgo: number) => ({
  bookingStatus: 'pending',
  paymentStatus: 'processing',
  paymentExpiredAt: null,
  createdAt: minutesAgo(createdMinutesAgo),
})

describe('isCheckoutClosed', () => {
  const on = { enabled: true, minutes: 60 }

  it('keeps a fresh unpaid checkout payable', () => {
    expect(isCheckoutClosed(unpaid(59), on, NOW)).toBe(false)
  })

  it('closes an unpaid checkout at the limit even if the job has not run', () => {
    expect(isCheckoutClosed(unpaid(60), on, NOW)).toBe(true)
    expect(isCheckoutClosed(unpaid(300), on, NOW)).toBe(true)
  })

  it('never closes by age when the admin switched expiry off', () => {
    expect(isCheckoutClosed(unpaid(300), { enabled: false, minutes: 60 }, NOW)).toBe(false)
  })

  it('closes cancelled, refunded and expired bookings whatever the setting', () => {
    const off = { enabled: false, minutes: 60 }
    expect(isCheckoutClosed({ ...unpaid(1), bookingStatus: 'cancelled' }, off, NOW)).toBe(true)
    expect(isCheckoutClosed({ ...unpaid(1), bookingStatus: 'refunded' }, off, NOW)).toBe(true)
    expect(isCheckoutClosed({ ...unpaid(1), paymentExpiredAt: minutesAgo(0) }, off, NOW)).toBe(true)
  })

  it('never closes a paid booking (the page redirects those to confirmation)', () => {
    expect(isCheckoutClosed({ ...unpaid(500), paymentStatus: 'completed', bookingStatus: 'cancelled' }, on, NOW)).toBe(false)
  })

  it('leaves payment_status pending (manual or cash) to the old rules', () => {
    expect(isCheckoutClosed({ ...unpaid(500), paymentStatus: 'pending' }, on, NOW)).toBe(false)
  })

  it('does not close on a missing or broken created_at', () => {
    expect(isCheckoutClosed({ ...unpaid(0), createdAt: null }, on, NOW)).toBe(false)
    expect(isCheckoutClosed({ ...unpaid(0), createdAt: 'not a date' }, on, NOW)).toBe(false)
  })
})

describe('isAwaitingPayment', () => {
  it('is only the pending + processing state without the expiry marker', () => {
    expect(isAwaitingPayment(unpaid(1))).toBe(true)
    expect(isAwaitingPayment({ ...unpaid(1), paymentExpiredAt: minutesAgo(0) })).toBe(false)
    expect(isAwaitingPayment({ ...unpaid(1), bookingStatus: 'confirmed' })).toBe(false)
  })
})

describe('customerPaymentLabel', () => {
  it('reads Awaiting payment while the customer has not paid', () => {
    expect(customerPaymentLabel(unpaid(1))).toBe('Awaiting payment')
    expect(customerPaymentLabel({ ...unpaid(1), paymentStatus: 'pending' })).toBe('Awaiting payment')
  })

  it('reads Expired (unpaid) once the job closed it', () => {
    expect(customerPaymentLabel({ ...unpaid(90), bookingStatus: 'cancelled', paymentExpiredAt: minutesAgo(5) })).toBe(
      'Expired (unpaid)'
    )
  })

  it('reads Paid when paid, even after a late payment over an expiry', () => {
    expect(customerPaymentLabel({ ...unpaid(90), paymentStatus: 'completed', bookingStatus: 'confirmed' })).toBe('Paid')
  })

  it('keeps other states as before', () => {
    expect(customerPaymentLabel({ ...unpaid(1), bookingStatus: 'cancelled' })).toBe('Not paid')
    expect(customerPaymentLabel({ ...unpaid(1), bookingStatus: 'cancelled', paymentStatus: 'pending' })).toBe('Not paid')
    expect(customerPaymentLabel({ ...unpaid(1), paymentStatus: 'failed' })).toBe('Failed')
    expect(customerPaymentLabel({ ...unpaid(1), paymentStatus: 'refunded', bookingStatus: 'refunded' })).toBe('Refunded')
  })
})

describe('vendorAssignBlockedReason', () => {
  it('blocks unpaid customer bookings', () => {
    expect(vendorAssignBlockedReason('customer', 'processing')).toBe(UNPAID_ASSIGN_BLOCKED_REASON)
    expect(vendorAssignBlockedReason('customer', 'pending')).toBe(UNPAID_ASSIGN_BLOCKED_REASON)
    expect(vendorAssignBlockedReason('customer', 'failed')).toBe(UNPAID_ASSIGN_BLOCKED_REASON)
    expect(vendorAssignBlockedReason(undefined, null)).toBe(UNPAID_ASSIGN_BLOCKED_REASON)
  })

  it('allows paid customer bookings and every business booking', () => {
    expect(vendorAssignBlockedReason('customer', 'completed')).toBeNull()
    expect(vendorAssignBlockedReason('business', 'processing')).toBeNull()
    expect(vendorAssignBlockedReason('business', 'completed')).toBeNull()
  })
})

describe('normaliseUnpaidExpiry', () => {
  it('defaults to on and 60 minutes when the row is missing', () => {
    expect(normaliseUnpaidExpiry(null)).toEqual(DEFAULT_UNPAID_EXPIRY)
    expect(DEFAULT_UNPAID_EXPIRY).toEqual({ enabled: true, minutes: 60 })
  })

  it('keeps valid values and replaces out-of-range minutes', () => {
    expect(normaliseUnpaidExpiry({ expire_unpaid_enabled: false, expire_unpaid_minutes: 30 })).toEqual({ enabled: false, minutes: 30 })
    expect(normaliseUnpaidExpiry({ expire_unpaid_enabled: true, expire_unpaid_minutes: 5 }).minutes).toBe(60)
    expect(normaliseUnpaidExpiry({ expire_unpaid_enabled: true, expire_unpaid_minutes: 2000 }).minutes).toBe(60)
    expect(normaliseUnpaidExpiry({ expire_unpaid_enabled: 'yes', expire_unpaid_minutes: 45 })).toEqual({ enabled: true, minutes: 45 })
  })
})

describe('bookingAutomationSchema', () => {
  it('accepts 15 to 1440 whole minutes, including a numeric string from the input', () => {
    expect(bookingAutomationSchema.safeParse({ enabled: true, minutes: 15 }).success).toBe(true)
    expect(bookingAutomationSchema.safeParse({ enabled: false, minutes: '1440' }).success).toBe(true)
  })

  it('rejects out of range, fractional and missing values', () => {
    expect(bookingAutomationSchema.safeParse({ enabled: true, minutes: 14 }).success).toBe(false)
    expect(bookingAutomationSchema.safeParse({ enabled: true, minutes: 1441 }).success).toBe(false)
    expect(bookingAutomationSchema.safeParse({ enabled: true, minutes: 30.5 }).success).toBe(false)
    expect(bookingAutomationSchema.safeParse({ minutes: 60 }).success).toBe(false)
  })
})
