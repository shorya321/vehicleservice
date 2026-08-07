import { createClient } from '@/lib/supabase/server'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { OCCUPYING_BOOKING_STATUSES } from '@/lib/vendor/direct-bookings/schema'

/**
 * Offline (direct) bookings, read for display on the vendor availability calendar.
 *
 * Why this is a separate module and not an extension of
 * `lib/vendor/direct-bookings/availability.ts`: that module answers one narrow
 * question, "is this window busy?", and returns opaque windows with pre-formatted
 * labels. It sits on the online accept path, the duration-change path and the
 * direct-booking create/update paths. Widening it to carry customer names,
 * references and released statuses would change the shape every one of those
 * callers consumes, for the benefit of a read-only consumer. The calendar asks a
 * different question, so it gets its own query.
 *
 * What must NOT be duplicated is the meaning of "occupies", and that already lives
 * in one place: `OCCUPYING_BOOKING_STATUSES`. This module imports it rather than
 * restating the status list.
 *
 * Why this is not a method on `AvailabilityService`: `lib/availability/service.ts`
 * is the module the online booking path *writes* through (createSchedule /
 * removeSchedule / updateScheduleWindow). It carries the highest blast radius in
 * the feature, and additive read-only code has no reason to land there.
 */

export interface DirectBookingCalendarRow {
  id: string
  reference_number: string
  booking_status: string
  customer_name: string
  customer_phone: string
  pickup_datetime: string
  return_datetime: string
  pickup_location: string
  dropoff_location: string | null
  total_price: number
  currency: string
  internal_notes: string | null
  vehicle: {
    id: string
    make: string | null
    model: string | null
    registration_number: string | null
  } | null
  driver: {
    id: string
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

/**
 * Whether a direct booking still holds its vehicle and driver.
 *
 * Mirrors the database exclusion constraints, which are scoped
 * `WHERE booking_status NOT IN ('cancelled','completed')`. Cancelled and
 * completed rows are drawn on the calendar as history, but must not read as
 * occupancy or the vendor sees a free slot as busy.
 */
export function directBookingOccupies(status: string): boolean {
  return (OCCUPYING_BOOKING_STATUSES as readonly string[]).includes(status)
}

/**
 * Every direct booking overlapping [startDate, endDate], past and future.
 *
 * Unlike `resource_schedules`, these rows are never deleted, so one range query
 * returns history and upcoming work together. There is no past/live split to
 * mirror and no dedupe to do: `createSchedule` is only ever called from the
 * online accept path, so a direct booking never writes a schedule row.
 *
 * Overlap is INCLUSIVE here, matching the display filter in
 * `AvailabilityService.getVendorSchedules`, so a booking spanning a month
 * boundary appears in both months. This is deliberately not the half-open form
 * used for conflict detection: that answers a different question and is not
 * this module's to change.
 *
 * Runs on the RLS client. The "Vendors view own direct bookings" policy scopes
 * the rows, and `getDirectBookings` already runs this exact embed under RLS in
 * production. The explicit vendor_id filter is kept anyway so the query states
 * its own scope.
 */
export async function getVendorDirectBookings(
  vendorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DirectBookingCalendarRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('vendor_direct_bookings')
    .select(
      `
        id, reference_number, booking_status,
        customer_name, customer_phone,
        pickup_datetime, return_datetime,
        pickup_location, dropoff_location,
        total_price, currency, internal_notes,
        vehicle:vehicles(id, make, model, registration_number),
        driver:vendor_drivers(id, first_name, last_name, phone)
      `
    )
    .eq('vendor_id', vendorId)
    .order('pickup_datetime', { ascending: true })

  // An unbounded call would scan the vendor's entire history, so a missing
  // startDate falls back to today rather than to the beginning of time.
  if (endDate) {
    query = query.lte('pickup_datetime', endDate.toISOString())
  }
  query = query.gte(
    'return_datetime',
    (startDate ?? startOfBookingDayUtc()).toISOString()
  )

  const { data, error } = await query

  if (error) {
    console.error('Error fetching vendor direct bookings:', error)
    throw new Error('Failed to fetch offline bookings')
  }

  // Boundary cast: PostgREST types embedded relations loosely; the select shape
  // matches DirectBookingCalendarRow by construction.
  return (data ?? []) as unknown as DirectBookingCalendarRow[]
}
