'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { bookingWallClockToUtc, toBookingTz } from '@/lib/utils/timezone'
import { getCurrentVendorContext, getCurrentVendorId } from '@/lib/vendor/get-vendor-id'
import {
  OCCUPYING_BOOKING_STATUSES,
  directBookingMutationSchema,
  firstIssueMessage,
  type DirectBookingFilters,
  type DirectBookingMutationInput,
  type DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'
import { normalizePhone } from '@/lib/validation/phone'
import { format } from 'date-fns'

import {
  findResourceConflicts,
  getFleetAvailability,
  isOverlapError,
  type FleetAvailability,
} from '@/lib/vendor/direct-bookings/availability'

// Row shapes live in ./types because a 'use server' module may only export async
// functions; a type export from here breaks at runtime and tsc stays silent.
import type {
  DirectBookingActionResult as ActionResult,
  DirectBookingRow,
  DirectBookingStats,
  VendorFleetOptions,
} from '@/lib/vendor/direct-bookings/types'

const LIST_PAGE_SIZE = 10
const REVALIDATE_PATH = '/vendor/direct-bookings'

/**
 * The row shape shared by create and update. `vendor_id` and `created_by` are
 * added by the callers from the session — never from `input`.
 */
/** The UTC window a booking occupies. Both ends are required. */
function toWindow(input: DirectBookingMutationInput): { start: Date; end: Date } {
  return {
    start: bookingWallClockToUtc(input.pickup_date, input.pickup_time),
    end: bookingWallClockToUtc(input.return_date, input.return_time),
  }
}

function toRowPayload(input: DirectBookingMutationInput) {
  const { start: pickup, end: returnAt } = toWindow(input)
  const returnDatetime = returnAt.toISOString()

  return {
    customer_name: input.customer_name.trim(),
    // Store the canonical form; the field validates without transforming so the
    // RHF value stays a plain string.
    customer_phone: normalizePhone(input.customer_phone),
    customer_email: input.customer_email?.trim() || null,
    customer_notes: input.customer_notes?.trim() || null,
    vehicle_id: input.vehicle_id,
    driver_id: input.driver_id,
    pickup_datetime: pickup.toISOString(),
    return_datetime: returnDatetime,
    pickup_location: input.pickup_location.trim(),
    dropoff_location: input.dropoff_location?.trim() || null,
    total_price: input.total_price,
    amount_paid: input.amount_paid,
    payment_status: input.payment_status,
    payment_method: input.payment_method || null,
    booking_status: input.booking_status,
    cancellation_reason: input.cancellation_reason?.trim() || null,
    internal_notes: input.internal_notes?.trim() || null,
  }
}

/**
 * Confirms the chosen vehicle — and driver, when given — belong to this vendor.
 *
 * A foreign key only proves the row exists, not who owns it. The database has a
 * matching trigger as the real backstop; this exists so the vendor gets a clean
 * message instead of a raw `23514`, and so the check still runs if a future
 * caller switches to the service-role client (which bypasses RLS entirely).
 */
/**
 * Turns a set of conflicts into one sentence naming what is blocking.
 *
 * Deliberately specific — "Vehicle unavailable" leaves the vendor guessing, while
 * naming the clashing booking and its hours lets them fix it themselves.
 */
function conflictMessage(conflicts: {
  vehicle: Array<{ label: string }>
  driver: Array<{ label: string }>
}): string | null {
  const parts: string[] = []

  if (conflicts.vehicle.length > 0) {
    parts.push(`the vehicle is already booked (${conflicts.vehicle[0].label})`)
  }
  if (conflicts.driver.length > 0) {
    parts.push(`the driver is already booked (${conflicts.driver[0].label})`)
  }

  if (parts.length === 0) return null

  return `Cannot save: ${parts.join(', and ')}.`
}

/**
 * True when the booking holds no resources, so conflict checks can be skipped.
 * Derived from the same allow-list the availability queries use.
 */
function releasesResources(status: string): boolean {
  return !OCCUPYING_BOOKING_STATUSES.includes(
    status as (typeof OCCUPYING_BOOKING_STATUSES)[number]
  )
}

/**
 * Message for a conflict the database caught that the pre-check missed — i.e. a
 * competing booking was committed in the moment between them.
 *
 * The trigger's own message names the clashing window, so prefer it; the exclusion
 * constraints raise a generic one, hence the fallback.
 */
function raceMessage(error: unknown): string {
  const detail =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message ?? '')
      : ''

  if (detail.startsWith('This ')) {
    return `Cannot save: ${detail.charAt(0).toLowerCase()}${detail.slice(1)}`
  }

  return 'Cannot save: that vehicle or driver was just booked for an overlapping time. Reload and try again.'
}

async function assertFleetOwnership(
  vendorId: string,
  vehicleId: string,
  driverId: string | null
): Promise<string | null> {
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('business_id', vendorId)
    .maybeSingle()

  if (!vehicle) return 'That vehicle is not part of your fleet'

  if (driverId) {
    const { data: driver } = await supabase
      .from('vendor_drivers')
      .select('id')
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
      .maybeSingle()

    if (!driver) return 'That driver is not part of your team'
  }

  return null
}

/**
 * Paginated list. Filtering and paging both happen in SQL — the online bookings
 * view filters in JS after hydration, which silently breaks its own pagination.
 */
export async function getDirectBookings(
  vendorId: string,
  filters: DirectBookingFilters = {}
): Promise<{
  bookings: DirectBookingRow[]
  total: number
  page: number
  totalPages: number
}> {
  const supabase = await createClient()

  const page = filters.page && filters.page > 0 ? filters.page : 1
  const limit = filters.limit ?? LIST_PAGE_SIZE

  let query = supabase
    .from('vendor_direct_bookings')
    .select(
      `
        id, reference_number, customer_name, customer_phone, customer_email,
        pickup_datetime, return_datetime, pickup_location, dropoff_location,
        total_price, amount_paid, currency,
        payment_status, payment_method, booking_status,
        vehicle:vehicles(id, make, model, registration_number),
        driver:vendor_drivers(id, first_name, last_name)
      `,
      { count: 'exact' }
    )
    .eq('vendor_id', vendorId)

  if (filters.status && filters.status !== 'all') {
    query = query.eq('booking_status', filters.status)
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  // Date filters are given as Dubai wall-clock days; widen each to the matching
  // UTC instant so a booking at 01:00 Dubai is not filed under the previous day.
  if (filters.from) {
    query = query.gte('pickup_datetime', bookingWallClockToUtc(filters.from, '00:00').toISOString())
  }

  if (filters.to) {
    query = query.lte('pickup_datetime', bookingWallClockToUtc(filters.to, '23:59').toISOString())
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, '')
    query = query.or(
      `customer_name.ilike.%${term}%,` +
        `customer_phone.ilike.%${term}%,` +
        `reference_number.ilike.%${term}%,` +
        `pickup_location.ilike.%${term}%`
    )
  }

  const { data, error, count } = await query
    .order('pickup_datetime', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error('Error fetching direct bookings:', error)
    return { bookings: [], total: 0, page, totalPages: 0 }
  }

  const total = count ?? 0

  return {
    bookings: (data ?? []) as unknown as DirectBookingRow[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getDirectBooking(id: string) {
  const supabase = await createClient()

  try {
    const vendorId = await getCurrentVendorId()

    const { data, error } = await supabase
      .from('vendor_direct_bookings')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: unknown) {
    console.error('Error fetching direct booking:', error)
    return { data: null, error: getMessage(error) }
  }
}

/** Counts come from the database, not from filtering a fetched array. */
export async function getDirectBookingStats(vendorId: string): Promise<DirectBookingStats> {
  const supabase = await createClient()

  const countWhere = async (apply: (q: any) => any) => {
    const { count } = await apply(
      supabase
        .from('vendor_direct_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
    )
    return count ?? 0
  }

  const startOfToday = bookingWallClockToUtc(
    format(toBookingTz(new Date().toISOString()), 'yyyy-MM-dd'),
    '00:00'
  )
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

  const [total, pending, completed, upcoming, unpaid] = await Promise.all([
    countWhere((q) => q),
    countWhere((q) => q.eq('booking_status', 'pending')),
    countWhere((q) => q.eq('booking_status', 'completed')),
    countWhere((q) =>
      q
        .gte('pickup_datetime', startOfToday.toISOString())
        .lt('pickup_datetime', endOfToday.toISOString())
    ),
    countWhere((q) => q.in('payment_status', ['unpaid', 'partial'])),
  ])

  return { total, pending, completed, today: upcoming, unpaid }
}

/** Vehicles and drivers for the form selects. */
export async function getVendorFleetOptions(vendorId: string): Promise<VendorFleetOptions> {
  const supabase = await createClient()

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, make, model, year, registration_number')
      .eq('business_id', vendorId)
      .order('make', { ascending: true }),
    supabase
      .from('vendor_drivers')
      .select('id, first_name, last_name, phone')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('first_name', { ascending: true }),
  ])

  return {
    vehicles: (vehicles ?? []) as VendorFleetOptions['vehicles'],
    drivers: (drivers ?? []) as VendorFleetOptions['drivers'],
  }
}

export async function createDirectBooking(
  input: DirectBookingMutationInput
): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    const parsed = directBookingMutationSchema.safeParse(input)
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) }

    const { vendorId, userId } = await getCurrentVendorContext()

    const ownershipError = await assertFleetOwnership(
      vendorId,
      parsed.data.vehicle_id,
      parsed.data.driver_id
    )
    if (ownershipError) return { error: ownershipError }

    // A booking created straight into cancelled/completed reserves nothing.
    if (!releasesResources(parsed.data.booking_status)) {
      const { start, end } = toWindow(parsed.data)
      const conflicts = await findResourceConflicts({
        vendorId,
        vehicleId: parsed.data.vehicle_id,
        driverId: parsed.data.driver_id,
        start,
        end,
      })

      const message = conflictMessage(conflicts)
      if (message) return { error: message }
    }

    const { data, error } = await supabase
      .from('vendor_direct_bookings')
      .insert({
        ...toRowPayload(parsed.data),
        vendor_id: vendorId,
        created_by: userId,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)
    return { success: true, id: data.id }
  } catch (error: unknown) {
    // The database is the real guarantee. If a conflicting booking landed between
    // the check above and this insert, the exclusion constraint or the cross-table
    // trigger rejects it here.
    if (isOverlapError(error)) {
      return { error: raceMessage(error) }
    }
    console.error('Error creating direct booking:', error)
    return { error: getMessage(error) }
  }
}

export async function updateDirectBooking(
  id: string,
  input: DirectBookingMutationInput
): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    const parsed = directBookingMutationSchema.safeParse(input)
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) }

    const vendorId = await getCurrentVendorId()

    const ownershipError = await assertFleetOwnership(
      vendorId,
      parsed.data.vehicle_id,
      parsed.data.driver_id
    )
    if (ownershipError) return { error: ownershipError }

    if (!releasesResources(parsed.data.booking_status)) {
      const { start, end } = toWindow(parsed.data)
      const conflicts = await findResourceConflicts({
        vendorId,
        vehicleId: parsed.data.vehicle_id,
        driverId: parsed.data.driver_id,
        start,
        end,
        // Without this a booking would collide with its own existing row.
        excludeDirectBookingId: id,
      })

      const message = conflictMessage(conflicts)
      if (message) return { error: message }
    }

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .update(toRowPayload(parsed.data))
      .eq('id', id)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)
    return { success: true }
  } catch (error: unknown) {
    if (isOverlapError(error)) {
      return { error: raceMessage(error) }
    }
    console.error('Error updating direct booking:', error)
    return { error: getMessage(error) }
  }
}

/**
 * Quick status change from the row menu. Cancelling needs a reason, so it is
 * routed through the full edit form rather than handled here.
 */
export async function updateDirectBookingStatus(
  id: string,
  status: DirectBookingStatus
): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    if (status === 'cancelled') {
      return { error: 'Open the booking to cancel it — a reason is required' }
    }

    const vendorId = await getCurrentVendorId()

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .update({ booking_status: status })
      .eq('id', id)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)
    return { success: true }
  } catch (error: unknown) {
    // Reviving a cancelled or completed booking re-arms the overlap rules, so this
    // can legitimately fail if the slot was taken meanwhile. Surface it rather than
    // reporting a misleading success.
    if (isOverlapError(error)) {
      return { error: raceMessage(error) }
    }
    console.error('Error updating direct booking status:', error)
    return { error: getMessage(error) }
  }
}

/**
 * Fleet availability for a window, for the form's selects.
 *
 * `excludeDirectBookingId` is the booking being edited, so it does not report itself
 * as the thing blocking its own resources.
 */
export async function getFleetAvailabilityForWindow(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
  excludeDirectBookingId?: string
): Promise<{ data: FleetAvailability | null; error: string | null }> {
  try {
    const vendorId = await getCurrentVendorId()

    const start = bookingWallClockToUtc(pickupDate, pickupTime)
    const end = bookingWallClockToUtc(returnDate, returnTime)

    if (end <= start) {
      return { data: null, error: 'Return must be after pickup' }
    }

    const data = await getFleetAvailability(vendorId, start, end, excludeDirectBookingId)
    return { data, error: null }
  } catch (error: unknown) {
    console.error('Error loading fleet availability:', error)
    return { data: null, error: getMessage(error) }
  }
}

export async function deleteDirectBooking(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    const vendorId = await getCurrentVendorId()

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .delete()
      .eq('id', id)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting direct booking:', error)
    return { error: getMessage(error) }
  }
}

export async function bulkDeleteDirectBookings(ids: string[]): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    if (!ids.length) return { error: 'Nothing selected' }

    const vendorId = await getCurrentVendorId()

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .delete()
      .in('id', ids)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting direct bookings:', error)
    return { error: getMessage(error) }
  }
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}
