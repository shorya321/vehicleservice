/**
 * Regression tests for the shared booking-payment finalizer.
 *
 * These lock the security-critical behavior shared by the client confirm route
 * and the webhook backstop: HMAC integrity, Stripe amount cross-check, and
 * idempotency (already-completed = no-op, no duplicate emails).
 *
 * Stripe, the Supabase admin client, and email senders are mocked. The HMAC
 * module is REAL so sign↔verify is exercised end-to-end.
 */

// HMAC secret must be set before the finalizer (which reads it) runs.
process.env.BOOKING_HMAC_SECRET = 'test-booking-hmac-secret'

import { signBookingPayload } from '@/lib/security/booking-hmac'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockRetrievePI = jest.fn()

jest.mock('@/lib/stripe/server', () => ({
  retrievePaymentIntent: (...args: unknown[]) => mockRetrievePI(...args),
  stripe: {},
  webhookSecret: 'whsec_test',
}))

// Mutable state the mocked admin client reads from, reset per test.
let currentBookingRow: Record<string, unknown> | null = null
let currentUpdatedRow: Record<string, unknown> | null = null

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const state = { isUpdate: false }
      const builder: Record<string, unknown> = {
        select: () => builder,
        update: () => {
          state.isUpdate = true
          return builder
        },
        eq: () => builder,
        order: () => builder,
        single: () => {
          if (table === 'bookings') {
            const data = state.isUpdate ? currentUpdatedRow : currentBookingRow
            return Promise.resolve({
              data,
              error: data ? null : { message: 'not found' },
            })
          }
          // Email projection lookups (passengers, vehicle_types, locations, etc.)
          return Promise.resolve({ data: null, error: null })
        },
      }
      return builder
    },
  }),
}))

const mockCustomerEmail = jest.fn().mockResolvedValue(undefined)
const mockAdminEmail = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/email/services/booking-emails', () => ({
  sendBookingConfirmationEmail: (...args: unknown[]) => mockCustomerEmail(...args),
}))
jest.mock('@/lib/email/services/admin-emails', () => ({
  sendNewBookingNotificationEmail: (...args: unknown[]) => mockAdminEmail(...args),
}))
jest.mock('@/lib/email/config', () => ({
  getAdminEmail: () => 'admin@example.com',
  getAppUrl: () => 'http://localhost:3001',
}))

import { finalizeBookingPayment } from '@/lib/payment/finalize-booking'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BOOKING_ID = 'booking-1'
const CUSTOMER_ID = 'customer-1'
const VEHICLE_TYPE_ID = 'vehicle-1'
const TOTAL_PRICE = 150

function buildSignedBooking(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const sig = signBookingPayload({
    bookingId: BOOKING_ID,
    totalPrice: TOTAL_PRICE,
    customerId: CUSTOMER_ID,
    vehicleTypeId: VEHICLE_TYPE_ID,
  })
  return {
    id: BOOKING_ID,
    customer_id: CUSTOMER_ID,
    vehicle_type_id: VEHICLE_TYPE_ID,
    total_price: TOTAL_PRICE,
    base_price: 140,
    amenities_price: 10,
    payment_status: 'processing',
    booking_status: 'pending',
    price_signature: sig.signature,
    price_signature_timestamp: sig.timestamp,
    price_signature_nonce: sig.nonce,
    pickup_datetime: new Date('2026-08-01T10:00:00Z').toISOString(),
    from_location_id: null,
    to_location_id: null,
    booking_number: 'BK-20260801-0001',
    trip_number: 'TRIP-1',
    passenger_count: 2,
    pickup_address: 'Pickup',
    dropoff_address: 'Dropoff',
    customer_notes: null,
    ...overrides,
  }
}

function buildPaymentIntent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'pi_test_1',
    status: 'succeeded',
    amount: Math.round(TOTAL_PRICE * 100),
    latest_charge: 'ch_test_1',
    payment_method_types: ['card'],
    currency: 'aed',
    ...overrides,
  }
}

beforeEach(() => {
  currentBookingRow = null
  currentUpdatedRow = null
  mockRetrievePI.mockReset()
  mockCustomerEmail.mockClear()
  mockAdminEmail.mockClear()
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('finalizeBookingPayment', () => {
  it('happy path: confirms booking and returns the updated row', async () => {
    currentBookingRow = buildSignedBooking()
    currentUpdatedRow = buildSignedBooking({ payment_status: 'completed', booking_status: 'confirmed' })
    mockRetrievePI.mockResolvedValue(buildPaymentIntent())

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: BOOKING_ID,
      expectedCustomerId: CUSTOMER_ID,
      userCurrency: 'AED',
      userEmail: 'user@example.com',
    })

    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.alreadyCompleted).toBeUndefined()
    expect((result.booking as Record<string, unknown>).payment_status).toBe('completed')
    expect(mockRetrievePI).toHaveBeenCalledWith('pi_test_1')
  })

  it('idempotent: already-completed booking is a no-op (no Stripe call, no emails)', async () => {
    currentBookingRow = buildSignedBooking({ payment_status: 'completed', booking_status: 'confirmed' })
    mockRetrievePI.mockResolvedValue(buildPaymentIntent())

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: BOOKING_ID,
      userCurrency: 'AED',
    })

    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.alreadyCompleted).toBe(true)
    expect(mockRetrievePI).not.toHaveBeenCalled()
    expect(mockCustomerEmail).not.toHaveBeenCalled()
    expect(mockAdminEmail).not.toHaveBeenCalled()
  })

  it('rejects amount mismatch with 403', async () => {
    currentBookingRow = buildSignedBooking()
    mockRetrievePI.mockResolvedValue(buildPaymentIntent({ amount: 999 }))

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: BOOKING_ID,
      userCurrency: 'AED',
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe(403)
    expect(result.error).toBe('Payment amount verification failed')
  })

  it('rejects tampered HMAC signature with 403', async () => {
    currentBookingRow = buildSignedBooking({ total_price: TOTAL_PRICE + 100 }) // price changed after signing
    mockRetrievePI.mockResolvedValue(buildPaymentIntent())

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: BOOKING_ID,
      userCurrency: 'AED',
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe(403)
    expect(result.error).toBe('Booking integrity verification failed')
    expect(mockRetrievePI).not.toHaveBeenCalled()
  })

  it('rejects non-succeeded PaymentIntent with 400', async () => {
    currentBookingRow = buildSignedBooking()
    mockRetrievePI.mockResolvedValue(buildPaymentIntent({ status: 'requires_payment_method' }))

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: BOOKING_ID,
      userCurrency: 'AED',
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe(400)
    expect(result.error).toBe('Payment not completed')
  })

  it('returns 404 when the booking is not found', async () => {
    currentBookingRow = null
    mockRetrievePI.mockResolvedValue(buildPaymentIntent())

    const result = await finalizeBookingPayment({
      paymentIntentId: 'pi_test_1',
      bookingId: 'missing',
      userCurrency: 'AED',
    })

    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
    expect(result.error).toBe('Booking not found')
  })
})
