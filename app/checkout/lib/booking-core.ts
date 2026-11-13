import 'server-only'
import { randomInt } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { clientAddress } from '@/lib/security/guest-access'
import { normaliseGuestEmail, signatureSubject } from '@/lib/security/guest-checkout'
import type { createAdminClient } from '@/lib/supabase/admin'
import { phoneSchema } from '@/lib/validation/phone'
import { roundMoney } from '@/lib/trips/pricing'
import { HOURLY_PACKAGES } from '@/lib/trips/types'
import { GROUP_NUMBER_PREFIX, MAX_LEGS_HARD_LIMIT } from '@/lib/trips/constants'

/**
 * Shared checks for the trip-type booking actions (hourly, round trip,
 * multi-city). Each mirrors the corresponding step of `createBooking` in
 * `../actions.ts`, which is deliberately left as it is so the one-way checkout
 * cannot regress.
 */

type AdminClient = ReturnType<typeof createAdminClient>

export const tripAddonSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  child_ages: z.array(z.number().int().min(0).max(12)).max(20).optional(),
})
export type TripAddonInput = z.infer<typeof tripAddonSchema>

/** Contact, party and consent fields every trip-type booking carries. */
export const tripContactSchema = z.object({
  vehicleTypeId: z.string().uuid(),
  passengerCount: z.number().int().min(1).max(50),
  adults: z.number().int().min(1).max(50),
  children: z.number().int().min(0).max(50),
  infants: z.number().int().min(0).max(50),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().email(),
  phone: phoneSchema,
  specialRequests: z.string().max(2000).optional(),
  /** Optional, as typed by the customer; normalised before it is stored. */
  flightNumber: z.string().max(40).optional(),
  agreeToTerms: z.literal(true),
  paymentMethod: z.literal('card'),
  selectedAddons: z.array(tripAddonSchema).max(20).optional(),
  /** Honeypot: hidden from people, so any value means a bot filled the form. */
  website: z.string().max(200).optional(),
})

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const hourlyBookingSchema = tripContactSchema.extend({
  fromLocationId: z.string().uuid(),
  hourlyPackage: z.enum(HOURLY_PACKAGES),
  pickupDate: z.string().regex(DATE_PATTERN),
  pickupTime: z.string().regex(TIME_PATTERN),
})
export type HourlyBookingInput = z.infer<typeof hourlyBookingSchema>

export const groupBookingSchema = tripContactSchema.extend({
  tripType: z.enum(['round_trip', 'multi_city']),
  legs: z
    .array(
      z.object({
        fromLocationId: z.string().uuid(),
        toLocationId: z.string().uuid(),
        date: z.string().regex(DATE_PATTERN),
        time: z.string().regex(TIME_PATTERN),
      })
    )
    .min(2)
    .max(MAX_LEGS_HARD_LIMIT),
})
export type GroupBookingInput = z.infer<typeof groupBookingSchema>

export class BookingInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingInputError'
    // ES5 target: without this, `instanceof BookingInputError` is false.
    Object.setPrototypeOf(this, BookingInputError.prototype)
  }
}

/** Who is booking: a signed-in customer, or a guest identified only by email. */
export type BookingActor =
  | { kind: 'customer'; userId: string }
  | { kind: 'guest'; email: string }

/** Guest bookings allowed per client address in one window (best effort, per instance). */
const GUEST_BOOKING_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }

/**
 * Resolves who is booking. A signed-in customer books exactly as before; a signed-in
 * admin, vendor or business account is still refused; an anonymous visitor books as a
 * guest after the honeypot and rate-limit checks.
 */
export async function resolveBookingActor(input: {
  email: string
  website?: string
}): Promise<BookingActor> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'customer') {
      throw new BookingInputError('Only customer accounts can book vehicles.')
    }
    return { kind: 'customer', userId: user.id }
  }

  return resolveGuestActor(input)
}

/**
 * The guest half of `resolveBookingActor`, for callers that have already found no
 * signed-in user: rejects a filled honeypot and rate-limits by client address.
 */
export async function resolveGuestActor(input: {
  email: string
  website?: string
}): Promise<{ kind: 'guest'; email: string }> {
  if (input.website && input.website.trim() !== '') {
    throw new BookingInputError('We could not place this booking. Please try again.')
  }

  const address = await clientAddress()
  const limit = checkRateLimit(`guest-booking:${address}`, GUEST_BOOKING_LIMIT)
  if (!limit.allowed) {
    throw new BookingInputError('Too many bookings from this connection. Please wait a few minutes and try again.')
  }

  return { kind: 'guest', email: normaliseGuestEmail(input.email) }
}

/** The owner columns every bookings and booking_groups row written for this actor carries. */
export function ownerColumns(actor: BookingActor): { customer_id: string | null; guest_email: string | null } {
  return actor.kind === 'customer'
    ? { customer_id: actor.userId, guest_email: null }
    : { customer_id: null, guest_email: actor.email }
}

/** The customer field of this actor's price signature (see `signatureSubject`). */
export function actorSignatureSubject(actor: BookingActor): string {
  const subject = signatureSubject(ownerColumns(actor))
  if (!subject) throw new Error('A booking must have an account or a guest email')
  return subject
}

export function assertPartyFits(
  party: { passengerCount: number; adults: number; children: number; infants: number },
  capacity: number
): void {
  if (party.adults + party.children + party.infants !== party.passengerCount) {
    throw new BookingInputError('The guest breakdown does not add up. Please review your guests.')
  }
  if (party.passengerCount > capacity) {
    throw new BookingInputError(`This vehicle seats ${capacity}; the booking is for ${party.passengerCount} passengers.`)
  }
}

export interface VerifiedAddon {
  id: string
  name: string
  price: number
  requiresChildAge: boolean
  quantity: number
  childAges: number[] | null
}

/**
 * Re-derives every add-on from the database (price, cap, child ages) exactly as
 * `createBooking` does. Returns the price of the add-ons for ONE transfer.
 */
export async function verifyAddons(
  adminClient: AdminClient,
  selected: TripAddonInput[] | undefined,
  party: { children: number; infants: number }
): Promise<{ perTransfer: number; addons: VerifiedAddon[] }> {
  if (!selected || selected.length === 0) return { perTransfer: 0, addons: [] }

  const { data: dbAddons, error } = await adminClient
    .from('addons')
    .select('id, name, price, max_quantity, requires_child_age')
    .in('id', selected.map((addon) => addon.addon_id))
    .eq('is_active', true)

  if (error || !dbAddons) throw new Error('Failed to verify addon prices')

  const byId = new Map(dbAddons.map((row) => [row.id, row]))
  const addons: VerifiedAddon[] = []
  let perTransferCents = 0
  let ageSeats = 0

  for (const addon of selected) {
    const db = byId.get(addon.addon_id)
    if (!db) throw new BookingInputError('One of the selected extras is no longer available.')
    if (Math.abs(addon.unit_price - db.price) > 0.01) throw new BookingInputError(`The price of ${db.name} has changed. Please review your extras.`)
    const expected = db.price * addon.quantity
    if (Math.abs(addon.total_price - expected) > 0.01) throw new BookingInputError(`The price of ${db.name} has changed. Please review your extras.`)
    if (db.max_quantity != null && addon.quantity > db.max_quantity) {
      throw new BookingInputError(`${db.name}: maximum ${db.max_quantity} per booking`)
    }
    if (db.requires_child_age) {
      if ((addon.child_ages ?? []).length !== addon.quantity) {
        throw new BookingInputError(`${db.name}: one child age is required per seat`)
      }
      ageSeats += addon.quantity
    }
    perTransferCents += Math.round(expected * 100)
    addons.push({
      id: db.id,
      name: db.name,
      price: db.price,
      requiresChildAge: db.requires_child_age,
      quantity: addon.quantity,
      childAges: db.requires_child_age ? addon.child_ages ?? null : null,
    })
  }

  if (ageSeats > party.children + party.infants) {
    throw new BookingInputError(
      `You selected ${ageSeats} child seat(s) but the booking has ${party.children + party.infants} child/infant guest(s).`
    )
  }

  return { perTransfer: roundMoney(perTransferCents / 100), addons }
}

export function amenityRows(bookingId: string, addons: VerifiedAddon[]) {
  return addons.map((addon) => ({
    booking_id: bookingId,
    amenity_type: 'addon',
    quantity: addon.quantity,
    price: roundMoney(addon.price * addon.quantity),
    addon_id: addon.id,
    child_ages: addon.childAges,
  }))
}

export function primaryPassengerRow(
  bookingId: string,
  contact: { firstName: string; lastName: string; email: string; phone: string }
) {
  return {
    booking_id: bookingId,
    is_primary: true,
    first_name: contact.firstName,
    last_name: contact.lastName,
    email: contact.email,
    phone: contact.phone,
  }
}

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * `length` random base-36 characters from a CSPRNG. The booking number is the bearer
 * for the public confirmation and invoice pages, so its random part must not be
 * predictable. Same alphabet and length as the old `Math.random` suffix.
 */
export function randomBase36(length: number): string {
  return Array.from({ length }, () => BASE36[randomInt(BASE36.length)]).join('')
}

export function newBookingNumber(prefix = 'BK'): string {
  return `${prefix}${Date.now()}${randomBase36(5)}`.toUpperCase()
}

/** `GR` + a sortable stamp + random suffix; the payment and invoice routes key on the prefix. */
export function newGroupNumber(): string {
  return `${GROUP_NUMBER_PREFIX}${Date.now().toString(36)}${randomBase36(4)}`.toUpperCase()
}
