/**
 * Who may book: a signed-in customer, a guest, or nobody (signed-in non-customer,
 * honeypot filled, rate limit reached).
 */
jest.mock('server-only', () => ({}), { virtual: true })

let mockUser: { id: string } | null = null
let mockRole: string | null = 'customer'

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockRole ? { role: mockRole } : null }),
        }),
      }),
    }),
  }),
}))

jest.mock('@/lib/security/guest-access', () => ({
  clientAddress: async () => '203.0.113.7',
}))

import {
  BookingInputError,
  actorSignatureSubject,
  ownerColumns,
  randomBase36,
  newBookingNumber,
  newGroupNumber,
  resolveBookingActor,
} from '@/app/checkout/lib/booking-core'
import { clearRateLimits } from '@/lib/security/rate-limit'

beforeEach(() => {
  mockUser = null
  mockRole = 'customer'
  clearRateLimits()
})

describe('resolveBookingActor', () => {
  it('a signed-in customer books as themselves, exactly as before', async () => {
    mockUser = { id: 'user-1' }
    await expect(resolveBookingActor({ email: 'x@y.com' })).resolves.toEqual({ kind: 'customer', userId: 'user-1' })
  })

  it('a signed-in vendor, admin or business account is still refused', async () => {
    mockUser = { id: 'user-2' }
    for (const role of ['vendor', 'admin', 'business']) {
      mockRole = role
      await expect(resolveBookingActor({ email: 'x@y.com' })).rejects.toBeInstanceOf(BookingInputError)
    }
  })

  it('a signed-in user with no profile is refused', async () => {
    mockUser = { id: 'user-3' }
    mockRole = null
    await expect(resolveBookingActor({ email: 'x@y.com' })).rejects.toBeInstanceOf(BookingInputError)
  })

  it('an anonymous visitor books as a guest with a normalised email', async () => {
    await expect(resolveBookingActor({ email: ' Guest@Example.com ' })).resolves.toEqual({
      kind: 'guest',
      email: 'guest@example.com',
    })
  })

  it('a filled honeypot is refused', async () => {
    await expect(resolveBookingActor({ email: 'g@e.com', website: 'http://spam' })).rejects.toBeInstanceOf(BookingInputError)
  })

  it('guests are rate limited per address', async () => {
    for (let i = 0; i < 5; i += 1) {
      await expect(resolveBookingActor({ email: 'g@e.com' })).resolves.toMatchObject({ kind: 'guest' })
    }
    await expect(resolveBookingActor({ email: 'g@e.com' })).rejects.toThrow(/Too many bookings/)
  })

  it('signed-in customers are never rate limited', async () => {
    mockUser = { id: 'user-1' }
    for (let i = 0; i < 8; i += 1) {
      await expect(resolveBookingActor({ email: 'x@y.com' })).resolves.toMatchObject({ kind: 'customer' })
    }
  })
})

describe('ownerColumns and actorSignatureSubject', () => {
  it('a customer owns the row by id, with no guest email', () => {
    const actor = { kind: 'customer' as const, userId: 'user-1' }
    expect(ownerColumns(actor)).toEqual({ customer_id: 'user-1', guest_email: null })
    expect(actorSignatureSubject(actor)).toBe('user-1')
  })

  it('a guest owns the row by email, with no account', () => {
    const actor = { kind: 'guest' as const, email: 'guest@example.com' }
    expect(ownerColumns(actor)).toEqual({ customer_id: null, guest_email: 'guest@example.com' })
    expect(actorSignatureSubject(actor)).toBe('guest:guest@example.com')
  })
})

describe('reference numbers', () => {
  it('keeps the BK / GR formats', () => {
    expect(newBookingNumber()).toMatch(/^BK\d{13}[0-9A-Z]{5}$/)
    expect(newGroupNumber()).toMatch(/^GR[0-9A-Z]+$/)
  })

  it('draws the random part from the base-36 alphabet', () => {
    const sample = randomBase36(500)
    expect(sample).toHaveLength(500)
    expect(sample).toMatch(/^[0-9a-z]+$/)
  })
})
