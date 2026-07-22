'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { bookingWallClockToUtc, toBookingTz } from '@/lib/utils/timezone'
import { getCurrentVendorContext, getCurrentVendorId } from '@/lib/vendor/get-vendor-id'
import {
  BOOKING_STATUS_LABELS,
  OCCUPYING_BOOKING_STATUSES,
  directBookingMutationSchema,
  firstIssueMessage,
  type DirectBookingFilters,
  type DirectBookingMutationInput,
  type DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'
import { getDirectBookingEmailPayload } from '@/lib/vendor/direct-bookings/email-payload'
import {
  sendDirectBookingCustomerCancelledEmail,
  sendDirectBookingCustomerConfirmationEmail,
  sendDirectBookingCustomerStatusUpdateEmail,
  sendDirectBookingDriverAssignmentEmail,
} from '@/lib/email/services/direct-booking-emails'
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

// ---------------------------------------------------------------------------
// Notification dispatch
//
// Every function below is best-effort and must stay that way. A booking write
// that succeeded must never be reported as failed because mail failed, so each
// helper swallows its own errors and none is awaited inside a mutation's happy
// path. `sendEmail` already returns rather than throws, but these guards do not
// rely on that.
// ---------------------------------------------------------------------------

/** Stamps notification bookkeeping. Failure here is logged and otherwise ignored. */
async function markNotified(
  id: string,
  patch: { confirmation_sent_at?: string; last_notified_status?: string }
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('vendor_direct_bookings').update(patch).eq('id', id)
  } catch (error) {
    console.error('Failed to stamp direct booking notification state:', error)
  }
}

/**
 * Emails the customer and the assigned driver about a newly recorded booking.
 *
 * Sends nothing for a booking created straight into cancelled or completed —
 * back-dated record entry is a normal use of this module and the customer should
 * not receive a confirmation for a trip that already ended or never ran.
 */
async function notifyBookingCreated(id: string): Promise<void> {
  try {
    const payload = await getDirectBookingEmailPayload(id)
    if (!payload) return

    if (releasesResources(payload.status)) return
    if (payload.confirmationSentAt) return

    const replyTo = payload.vendor.businessEmail ?? undefined
    const vendorPhone = payload.vendor.businessPhone ?? undefined

    if (payload.customerEmail) {
      void sendDirectBookingCustomerConfirmationEmail({
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        bookingReference: payload.reference,
        statusLabel: payload.statusLabel,
        vehicleLabel: payload.vehicleLabel,
        vehicleRegistration: payload.vehicleRegistration,
        driverName: payload.driverName,
        driverPhone: payload.driverPhone ?? undefined,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation ?? undefined,
        pickupDate: payload.pickupDate,
        pickupTime: payload.pickupTime,
        returnDate: payload.returnDate,
        returnTime: payload.returnTime,
        totalAmount: payload.totalAmount,
        amountPaid: payload.amountPaid,
        balanceDue: payload.balanceDue,
        currency: payload.currency,
        paymentStatusLabel: payload.paymentStatusLabel,
        paymentMethodLabel: payload.paymentMethodLabel ?? undefined,
        customerNotes: payload.customerNotes ?? undefined,
        vendorName: payload.vendor.businessName,
        vendorPhone,
        replyTo,
      }).catch((error) =>
        console.error('Failed to send direct booking customer confirmation:', error)
      )
    }

    if (payload.driverEmail) {
      void sendDirectBookingDriverAssignmentEmail({
        driverEmail: payload.driverEmail,
        driverName: payload.driverName,
        bookingReference: payload.reference,
        customerName: payload.customerName,
        vehicleLabel: payload.vehicleLabel,
        vehicleRegistration: payload.vehicleRegistration,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation ?? undefined,
        pickupDate: payload.pickupDate,
        pickupTime: payload.pickupTime,
        returnDate: payload.returnDate,
        returnTime: payload.returnTime,
        vendorName: payload.vendor.businessName,
        vendorPhone,
        replyTo,
      }).catch((error) =>
        console.error('Failed to send direct booking driver assignment:', error)
      )
    }

    await markNotified(id, {
      confirmation_sent_at: new Date().toISOString(),
      last_notified_status: payload.status,
    })
  } catch (error) {
    console.error('Direct booking create notification failed:', error)
  }
}

/**
 * Emails the customer that the booking changed status.
 *
 * `previousStatus` comes from a read taken before the write — without it a
 * re-save that changed nothing would be indistinguishable from a real move.
 */
async function notifyStatusChanged(id: string, previousStatus: string): Promise<void> {
  try {
    const payload = await getDirectBookingEmailPayload(id)
    if (!payload) return
    if (payload.status === previousStatus) return
    if (payload.lastNotifiedStatus === payload.status) return
    if (!payload.customerEmail) return

    const replyTo = payload.vendor.businessEmail ?? undefined
    const vendorPhone = payload.vendor.businessPhone ?? undefined
    const previousLabel =
      BOOKING_STATUS_LABELS[previousStatus as DirectBookingStatus] ?? previousStatus

    if (payload.status === 'cancelled') {
      void sendDirectBookingCustomerCancelledEmail({
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        bookingReference: payload.reference,
        vehicleLabel: payload.vehicleLabel,
        pickupDate: payload.pickupDate,
        pickupTime: payload.pickupTime,
        vendorName: payload.vendor.businessName,
        vendorPhone,
        replyTo,
      }).catch((error) =>
        console.error('Failed to send direct booking cancellation:', error)
      )
    } else {
      void sendDirectBookingCustomerStatusUpdateEmail({
        customerEmail: payload.customerEmail,
        customerName: payload.customerName,
        bookingReference: payload.reference,
        previousStatusLabel: previousLabel,
        newStatusLabel: payload.statusLabel,
        vehicleLabel: payload.vehicleLabel,
        pickupDate: payload.pickupDate,
        pickupTime: payload.pickupTime,
        vendorName: payload.vendor.businessName,
        vendorPhone,
        replyTo,
      }).catch((error) =>
        console.error('Failed to send direct booking status update:', error)
      )
    }

    await markNotified(id, { last_notified_status: payload.status })
  } catch (error) {
    console.error('Direct booking status notification failed:', error)
  }
}

/** Emails a driver who has just been assigned to an existing booking. */
async function notifyDriverReassigned(id: string): Promise<void> {
  try {
    const payload = await getDirectBookingEmailPayload(id)
    if (!payload) return
    if (releasesResources(payload.status)) return
    if (!payload.driverEmail) return

    void sendDirectBookingDriverAssignmentEmail({
      driverEmail: payload.driverEmail,
      driverName: payload.driverName,
      bookingReference: payload.reference,
      customerName: payload.customerName,
      vehicleLabel: payload.vehicleLabel,
      vehicleRegistration: payload.vehicleRegistration,
      pickupLocation: payload.pickupLocation,
      dropoffLocation: payload.dropoffLocation ?? undefined,
      pickupDate: payload.pickupDate,
      pickupTime: payload.pickupTime,
      returnDate: payload.returnDate,
      returnTime: payload.returnTime,
      vendorName: payload.vendor.businessName,
      vendorPhone: payload.vendor.businessPhone ?? undefined,
      replyTo: payload.vendor.businessEmail ?? undefined,
    }).catch((error) =>
      console.error('Failed to send direct booking driver reassignment:', error)
    )
  } catch (error) {
    console.error('Direct booking driver notification failed:', error)
  }
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
      // reference_number is generated by a BEFORE INSERT trigger; read it back so
      // notification emails can quote it without a second round trip.
      .select('id, reference_number')
      .single()

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)

    // The booking is committed. Everything from here is best-effort: the result
    // is fixed before dispatch and notifyBookingCreated absorbs its own errors,
    // so no mail problem can turn a saved booking into a reported failure.
    const result: ActionResult = {
      success: true,
      id: data.id,
      reference_number: data.reference_number,
    }
    await notifyBookingCreated(data.id).catch(() => {})
    return result
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

    // Read before the write: the update is a blind overwrite, so without this
    // there is no way to tell a real change from a re-save of identical values.
    // Failure here must not block the edit, so it degrades to "no notification".
    const { data: previous } = await supabase
      .from('vendor_direct_bookings')
      .select('booking_status, driver_id')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .maybeSingle()

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .update(toRowPayload(parsed.data))
      .eq('id', id)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)

    if (previous) {
      if (previous.booking_status !== parsed.data.booking_status) {
        await notifyStatusChanged(id, previous.booking_status).catch(() => {})
      }
      if (previous.driver_id !== parsed.data.driver_id) {
        await notifyDriverReassigned(id).catch(() => {})
      }
    }

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

    // This action holds only an id and a status, so the previous value has to be
    // read before the write for the notification to say what changed.
    const { data: previous } = await supabase
      .from('vendor_direct_bookings')
      .select('booking_status')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .maybeSingle()

    const { error } = await supabase
      .from('vendor_direct_bookings')
      .update({ booking_status: status })
      .eq('id', id)
      .eq('vendor_id', vendorId)

    if (error) throw error

    revalidatePath(REVALIDATE_PATH)

    if (previous && previous.booking_status !== status) {
      await notifyStatusChanged(id, previous.booking_status).catch(() => {})
    }

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
