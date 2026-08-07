/**
 * Shapes and constants for the vendor availability calendar.
 *
 * These deliberately live here rather than in `./actions.ts`. A `'use server'`
 * module may only export async functions. Exporting a type from one compiles
 * cleanly but breaks the app at runtime, on an unrelated route, in a way
 * `tsc --noEmit` will not surface. `CalendarEvent` used to live in `actions.ts`
 * and was imported by the client through a mixed value import, which is exactly
 * the shape of that bug. Same reasoning as `lib/vendor/direct-bookings/types.ts`.
 *
 * Colour constants and predicates live here too, so the server (which picks the
 * colour) and the client (which decides solid vs. hatched) read one definition.
 */

/** Where the occupancy came from. Drives hue. */
export type CalendarEventSource = 'online' | 'offline' | 'blocked'

/** The vendor's fleet, as `getVendorResources` returns it. Nullability mirrors the
 *  generated Supabase row types so the two cannot drift. */
export interface CalendarVehicle {
  id: string
  make: string | null
  model: string | null
  year: number | null
  registration_number: string | null
  seats: number | null
  is_available: boolean | null
}

export interface CalendarDriver {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  license_number: string | null
  is_active: boolean | null
}

export interface CalendarVehicleDetails {
  id: string
  make: string | null
  model: string | null
  registrationNumber: string | null
}

export interface CalendarDriverDetails {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
}

export interface CalendarBookingDetails {
  bookingNumber?: string | null
  tripNumber?: string | null
  /** `DB-YYYYMMDD-NNNN` for offline bookings. Null for online ones. */
  reference?: string | null
  customer?: string | null
  phone?: string | null
  pickup?: string | null
  dropoff?: string | null
  status?: string | null
  totalPrice?: number | null
  currency?: string | null
  notes?: string | null
  vehicle: CalendarVehicleDetails | null
  driver: CalendarDriverDetails | null
}

export interface CalendarUnavailabilityDetails {
  reason: string
  notes: string | null
}

export type CalendarEventDetails =
  | CalendarBookingDetails
  | CalendarUnavailabilityDetails

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
  /** Unavailability blocks one resource. Bookings occupy a vehicle *and* a driver,
   *  so they carry both ids instead (see vehicleId / driverId). */
  resourceType: 'vehicle' | 'driver' | 'booking'
  type: 'booking' | 'unavailable'
  /** Set on booking events only. The resources the booking actually occupies.
   *  The resource filter needs these; resourceType alone cannot express "both".
   *  Both are null on a pending offer, which has not named its resources yet. */
  vehicleId?: string | null
  driverId?: string | null
  color?: string
  details?: CalendarEventDetails

  /** Origin of the occupancy. */
  source: CalendarEventSource
  /**
   * Whether this event actually holds its vehicle and driver right now.
   *
   * Load-bearing, not decoration. Cancelled and completed direct bookings
   * release their resources (the database exclusion constraints carry
   * `WHERE booking_status NOT IN ('cancelled','completed')`), and a pending
   * offer has named no resources at all. Drawing either like a live booking
   * would make the vendor read a free slot as busy, so anything false here
   * renders outlined and hatched rather than solid.
   */
  occupies: boolean
  /** Hoisted out of `details` so filters can read it without narrowing. */
  status?: string | null
  /** Deep link to the underlying record, where one exists. */
  href?: string
}

/**
 * Hue encodes origin, solid vs. outlined encodes `occupies`.
 *
 * Every solid fill clears 4.5:1 against white text. Amber-500 does not (~2.1:1),
 * which is why it is used only for the pending treatment, where it pairs a light
 * fill with amber-900 text and a dashed border so "not confirmed yet" survives
 * without relying on colour alone.
 */
export const CALENDAR_COLORS = {
  onlineUpcoming: '#3B82F6',
  onlinePastRan: '#10B981',
  pastNoTrip: '#6B7280',
  offlineUpcoming: '#8B5CF6',
  offlineCompleted: '#0D9488',
  blocked: '#EF4444',
  pendingFill: '#FEF3C7',
  pendingBorder: '#F59E0B',
  pendingText: '#78350F',
} as const

/**
 * Narrow `details` by the event's own discriminator.
 *
 * `type` already tells the truth about which branch of the union is present, but
 * TypeScript cannot see that across two sibling fields, and the alternative was
 * `details?: any` with a dozen unchecked property reads in the dialog.
 */
export function bookingDetailsOf(
  event: Pick<CalendarEvent, 'type' | 'details'>
): CalendarBookingDetails | null {
  return event.type === 'booking'
    ? ((event.details ?? null) as CalendarBookingDetails | null)
    : null
}

export function unavailabilityDetailsOf(
  event: Pick<CalendarEvent, 'type' | 'details'>
): CalendarUnavailabilityDetails | null {
  return event.type === 'unavailable'
    ? ((event.details ?? null) as CalendarUnavailabilityDetails | null)
    : null
}

/** Statuses meaning the trip is over or never happened, whichever table it came from. */
const RELEASED_STATUSES = new Set(['completed', 'cancelled', 'rejected'])

/** A booking that has already ended, or unavailability that has already elapsed. */
export function isPastEvent(event: Pick<CalendarEvent, 'end'>): boolean {
  return !!event.end && event.end < new Date()
}

/**
 * Whether the "Show completed & cancelled" switch should hide this event.
 *
 * Keyed off status rather than `!occupies` on purpose. Pending offers are also
 * non-occupying, and a switch labelled "completed & cancelled" must never hide
 * work the vendor still has to respond to.
 */
export function isReleased(
  event: Pick<CalendarEvent, 'type' | 'status'>
): boolean {
  return event.type === 'booking' && RELEASED_STATUSES.has(event.status ?? '')
}
