import 'server-only'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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
  agreeToTerms: z.literal(true),
  paymentMethod: z.literal('card'),
  selectedAddons: z.array(tripAddonSchema).max(20).optional(),
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

/** The signed-in customer, or a thrown error for anyone else (same rule as `createBooking`). */
export async function requireBookingCustomer(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new BookingInputError('Please sign in to complete your booking.')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'customer') {
    throw new BookingInputError('Only customer accounts can book vehicles.')
  }
  return { userId: user.id }
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

export function newBookingNumber(prefix = 'BK'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`.toUpperCase()
}

/** `GR` + a sortable stamp + random suffix; the payment and invoice routes key on the prefix. */
export function newGroupNumber(): string {
  return `${GROUP_NUMBER_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()
}
