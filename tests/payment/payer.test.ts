/**
 * Payment page access: an account pays for its own bookings; a guest booking only from
 * the browser that created it (guest cookie), signed in since or not.
 */
jest.mock('server-only', () => ({}), { virtual: true })

let mockGuestAccess = false
jest.mock('@/lib/security/guest-access', () => ({
  hasGuestAccess: async () => mockGuestAccess,
}))

import type { User } from '@supabase/supabase-js'
import { payerOwns, receiptEmail, resolvePayer, stripeCustomerAccount } from '@/app/payment/lib/payer'

const user = { id: 'user-1', email: 'me@example.com' } as User

beforeEach(() => {
  mockGuestAccess = false
})

describe('resolvePayer', () => {
  it('anonymous without guest access has no access at all', async () => {
    await expect(resolvePayer('BK1', null)).resolves.toBeNull()
  })

  it('anonymous with guest access is a guest payer', async () => {
    mockGuestAccess = true
    await expect(resolvePayer('BK1', null)).resolves.toEqual({ userId: null, email: '', guestAccess: true })
  })

  it('a signed-in user keeps guest access to the booking their browser made', async () => {
    mockGuestAccess = true
    await expect(resolvePayer('BK1', user)).resolves.toEqual({ userId: 'user-1', email: 'me@example.com', guestAccess: true })
  })
})

describe('payerOwns', () => {
  const customer = { userId: 'user-1', email: 'me@example.com', guestAccess: false }
  const guest = { userId: null, email: '', guestAccess: true }
  const signedInGuest = { userId: 'user-1', email: 'me@example.com', guestAccess: true }

  it('an account owns only its own rows (unchanged)', () => {
    expect(payerOwns('user-1', customer)).toBe(true)
    expect(payerOwns('user-2', customer)).toBe(false)
    expect(payerOwns(null, customer)).toBe(false)
  })

  it('a guest owns only guest rows, and never an account row', () => {
    expect(payerOwns(null, guest)).toBe(true)
    expect(payerOwns('user-1', guest)).toBe(false)
  })

  it('a signed-in guest owns both their own rows and the guest row', () => {
    expect(payerOwns(null, signedInGuest)).toBe(true)
    expect(payerOwns('user-1', signedInGuest)).toBe(true)
    expect(payerOwns('user-2', signedInGuest)).toBe(false)
  })

  it('receipt and Stripe customer follow the row, not the visitor', () => {
    expect(receiptEmail(null, signedInGuest, 'guest@example.com')).toBe('guest@example.com')
    expect(receiptEmail('user-1', customer, null)).toBe('me@example.com')
    expect(stripeCustomerAccount(null, signedInGuest)).toBeNull()
    expect(stripeCustomerAccount('user-1', customer)).toBe('user-1')
  })
})
