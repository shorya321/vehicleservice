'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AvailabilityService,
  type PastBookingAssignment,
} from '@/lib/availability/service'
import {
  getVendorDirectBookings,
  directBookingOccupies,
  type DirectBookingCalendarRow,
} from '@/lib/availability/direct-bookings'
import { getVendorPendingAssignments } from '@/lib/availability/pending-assignments'
import { getBusyResourceWindows } from '@/lib/vendor/direct-bookings/availability'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { tripEndFrom } from '@/lib/vendor/bookings/duration'
import { revalidatePath } from 'next/cache'
import { CALENDAR_COLORS, type CalendarEvent } from './types'

/** The join every calendar event needs off an assignment. Hoisted because the
 *  batched live-schedule fetch below and `getVendorPastBookings` build the same
 *  shape, and both feed `PastBookingAssignment`. */
const ASSIGNMENT_CALENDAR_SELECT = `
  id,
  status,
  estimated_duration_hours,
  booking:bookings(
    booking_number,
    trip_number,
    pickup_address,
    dropoff_address,
    pickup_datetime,
    customer:profiles(full_name, phone)
  ),
  business_booking:business_bookings(
    booking_number,
    trip_number,
    pickup_address,
    dropoff_address,
    pickup_datetime,
    customer_name,
    customer_phone,
    from_location:locations!from_location_id(name),
    to_location:locations!to_location_id(name)
  ),
  vehicle:vehicles(id, make, model, registration_number),
  driver:vendor_drivers(id, first_name, last_name, phone)
`

function pastBookingColor(status: string | null): string {
  return status === 'completed' || status === 'accepted'
    ? CALENDAR_COLORS.onlinePastRan
    : CALENDAR_COLORS.pastNoTrip
}

/** Violet while it holds the resources, teal once it ran, grey if it fell through.
 *  Hue separates offline from the blue/green online family; see ./types.ts. */
function directBookingColor(status: string): string {
  if (directBookingOccupies(status)) return CALENDAR_COLORS.offlineUpcoming
  return status === 'completed'
    ? CALENDAR_COLORS.offlineCompleted
    : CALENDAR_COLORS.pastNoTrip
}

/**
 * Build ONE calendar event from an assignment joined to its booking / business
 * booking / vehicle / driver. Shared by the live-schedule path and the past-booking
 * path so both emit an identical event shape. The client dialog, resource filter,
 * and dimming then work on either without special-casing.
 */
function assignmentToCalendarEvent(
  assignment: PastBookingAssignment,
  start: Date,
  end: Date,
  status: string | null,
  color: string,
  /** False for past trips (their hold is deleted) and for pending offers (which
   *  never had one). The client draws non-occupying future events hatched. */
  occupies: boolean
): CalendarEvent {
  // Normalize booking data - use business_booking if booking is null
  const bookingData = assignment.booking || (assignment.business_booking ? {
    booking_number: assignment.business_booking.booking_number,
    trip_number: assignment.business_booking.trip_number,
    pickup_address: assignment.business_booking.from_location?.name
      ? `${assignment.business_booking.from_location.name} - ${assignment.business_booking.pickup_address}`
      : assignment.business_booking.pickup_address,
    dropoff_address: assignment.business_booking.to_location?.name
      ? `${assignment.business_booking.to_location.name} - ${assignment.business_booking.dropoff_address}`
      : assignment.business_booking.dropoff_address,
    pickup_datetime: assignment.business_booking.pickup_datetime,
    customer: {
      full_name: assignment.business_booking.customer_name,
      phone: assignment.business_booking.customer_phone
    }
  } : null)

  return {
    id: assignment.id, // Use assignment ID as unique event ID
    title: `Trip #${bookingData?.trip_number || bookingData?.booking_number || 'N/A'}`,
    start,
    end,
    resourceId: assignment.id, // Use assignment ID
    resourceType: 'booking', // Occupies a vehicle and a driver, not one resource
    type: 'booking',
    // Carried so the resource filter can match a booking against a specific
    // vehicle or driver. Without these it can only ask "is it a booking?" and
    // every booking passes every filter. Both are null on a pending offer, which
    // is correct: it has named no resources, so it belongs to no lane.
    vehicleId: assignment.vehicle?.id ?? null,
    driverId: assignment.driver?.id ?? null,
    color,
    source: 'online',
    occupies,
    status,
    href: `/vendor/bookings/${assignment.id}`,
    details: {
      bookingNumber: bookingData?.booking_number,
      tripNumber: bookingData?.trip_number,
      reference: null,
      customer: bookingData?.customer?.full_name,
      phone: bookingData?.customer?.phone,
      pickup: bookingData?.pickup_address,
      dropoff: bookingData?.dropoff_address,
      status,
      // Include both vehicle and driver details
      vehicle: assignment.vehicle ? {
        id: assignment.vehicle.id,
        make: assignment.vehicle.make,
        model: assignment.vehicle.model,
        registrationNumber: assignment.vehicle.registration_number
      } : null,
      driver: assignment.driver ? {
        id: assignment.driver.id,
        firstName: assignment.driver.first_name,
        lastName: assignment.driver.last_name,
        phone: assignment.driver.phone
      } : null
    }
  }
}

/**
 * Build ONE calendar event from an offline (direct) booking.
 *
 * Unlike an online booking, a direct booking carries a real `return_datetime`, so
 * the window is exact rather than derived from an estimated hold length.
 *
 * The reference number leads the title because it is what the vendor quotes on the
 * phone when the customer calls back about this trip.
 */
function directBookingToCalendarEvent(
  row: DirectBookingCalendarRow
): CalendarEvent {
  return {
    id: `direct-${row.id}`,
    title: `${row.reference_number} · ${row.customer_name}`,
    start: new Date(row.pickup_datetime),
    end: new Date(row.return_datetime),
    resourceId: row.id,
    // Same as online bookings: occupies a vehicle AND a driver, so it carries
    // both ids and the existing resource filter handles it with no change.
    resourceType: 'booking',
    type: 'booking',
    vehicleId: row.vehicle?.id ?? null,
    driverId: row.driver?.id ?? null,
    color: directBookingColor(row.booking_status),
    source: 'offline',
    // Cancelled and completed rows release the vehicle and driver: the database
    // exclusion constraints are scoped `WHERE booking_status NOT IN
    // ('cancelled','completed')`. Drawing them as occupancy would show a free
    // slot as busy.
    occupies: directBookingOccupies(row.booking_status),
    status: row.booking_status,
    href: `/vendor/direct-bookings/${row.id}/edit`,
    details: {
      bookingNumber: row.reference_number,
      tripNumber: null,
      reference: row.reference_number,
      customer: row.customer_name,
      phone: row.customer_phone,
      pickup: row.pickup_location,
      dropoff: row.dropoff_location,
      status: row.booking_status,
      totalPrice: row.total_price,
      currency: row.currency,
      notes: row.internal_notes,
      vehicle: row.vehicle
        ? {
            id: row.vehicle.id,
            make: row.vehicle.make,
            model: row.vehicle.model,
            registrationNumber: row.vehicle.registration_number,
          }
        : null,
      driver: row.driver
        ? {
            id: row.driver.id,
            firstName: row.driver.first_name,
            lastName: row.driver.last_name,
            phone: row.driver.phone,
          }
        : null,
    },
  }
}

export async function getVendorCalendarEvents(
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  const events: CalendarEvent[] = []

  // Get resource schedules (bookings)
  const schedules = await AvailabilityService.getVendorSchedules(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  // Group schedules by booking_assignment_id to create ONE event per booking
  const bookingGroups = schedules.reduce((acc, schedule) => {
    if (!schedule.booking_assignment_id) return acc
    if (!acc[schedule.booking_assignment_id]) {
      acc[schedule.booking_assignment_id] = []
    }
    acc[schedule.booking_assignment_id].push(schedule)
    return acc
  }, {} as Record<string, typeof schedules>)

  // One batched fetch for every assignment on screen, then a Map lookup per group.
  // This used to be a query per booking; a busy month meant dozens of round trips.
  const assignmentIds = Object.keys(bookingGroups)
  const assignmentsById = new Map<string, PastBookingAssignment>()

  if (assignmentIds.length > 0) {
    const { data: assignments, error: assignmentsError } = await adminClient
      .from('booking_assignments')
      .select(ASSIGNMENT_CALENDAR_SELECT)
      // Redundant given the schedule rows were already vendor-filtered, but this
      // runs on the service-role client, so the query states its own scope rather
      // than trusting an invariant established three calls away.
      .eq('vendor_id', vendorApp.id)
      .in('id', assignmentIds)

    if (assignmentsError) {
      console.error('Error fetching booking assignments:', assignmentsError)
      throw new Error('Failed to load booking details')
    }

    for (const row of (assignments ?? []) as unknown as PastBookingAssignment[]) {
      assignmentsById.set(row.id, row)
    }
  }

  // Create one event per booking (not per resource)
  for (const [assignmentId, groupSchedules] of Object.entries(bookingGroups)) {
    // Use first schedule for timing (all schedules for same booking have same times)
    const firstSchedule = groupSchedules[0]

    const assignment = assignmentsById.get(assignmentId)
    if (!assignment) continue

    events.push(
      assignmentToCalendarEvent(
        assignment,
        new Date(firstSchedule.start_datetime),
        new Date(firstSchedule.end_datetime),
        firstSchedule.status,
        CALENDAR_COLORS.onlineUpcoming,
        // A live schedule row IS the hold.
        true
      )
    )
  }

  // Past bookings: sourced from booking_assignments (the permanent record) because
  // their resource_schedules rows are deleted on completion/cancellation. Colour is
  // by status so completed trips (green) read differently from cancelled (gray).
  const pastBookings = await AvailabilityService.getVendorPastBookings(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  for (const pastBooking of pastBookings) {
    const pickup = pastBooking.booking?.pickup_datetime ?? pastBooking.business_booking?.pickup_datetime
    if (!pickup) continue
    const start = new Date(pickup)
    const end = tripEndFrom(start, pastBooking.estimated_duration_hours)

    events.push(
      assignmentToCalendarEvent(
        pastBooking,
        start,
        end,
        pastBooking.status,
        pastBookingColor(pastBooking.status),
        // The trip is over and its schedule rows were deleted. It holds nothing.
        // Past events are dimmed rather than hatched, so this does not change how
        // they look; it keeps the flag honest for anything that reads it.
        false
      )
    )
  }

  // Offline bookings. Recorded at /vendor/direct-bookings, they hold a vehicle and
  // a driver through database exclusion constraints, but never wrote a
  // resource_schedules row, so nothing above can see them. Past and upcoming come
  // back together: unlike schedules, these rows are never deleted.
  const directBookings = await getVendorDirectBookings(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  for (const directBooking of directBookings) {
    events.push(directBookingToCalendarEvent(directBooking))
  }

  // Offers this vendor has not answered yet. They reserve nothing (no schedule row
  // exists until acceptance) and name no vehicle or driver, but they are about to
  // consume a slot, so the vendor needs to see them before selling that slot
  // offline. Rendered non-occupying, and with a guessed end time, because the
  // duration is not chosen until the booking is accepted.
  const pendingAssignments = await getVendorPendingAssignments(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  for (const pending of pendingAssignments) {
    const pickup = pending.booking?.pickup_datetime ?? pending.business_booking?.pickup_datetime
    if (!pickup) continue
    const start = new Date(pickup)

    events.push(
      assignmentToCalendarEvent(
        pending,
        start,
        // No duration has been chosen yet. tripEndFrom falls back to the default
        // hold length; the client labels the block as awaiting a response so the
        // guessed width never reads as a committed window.
        tripEndFrom(start, null),
        'pending',
        CALENDAR_COLORS.pendingBorder,
        false
      )
    )
  }

  // Get unavailability periods
  const unavailability = await AvailabilityService.getVendorUnavailability(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  // resource_type is a plain text column guarded by a CHECK constraint, so the
  // generated type widens it to string. Anything else is corrupt data, not a
  // calendar event.
  const typedPeriods = unavailability.flatMap((period) => {
    const resourceType: 'vehicle' | 'driver' | null =
      period.resource_type === 'vehicle' ? 'vehicle'
        : period.resource_type === 'driver' ? 'driver'
        : null

    if (!resourceType) {
      console.error('Unavailability row with unexpected resource_type', {
        id: period.id,
        resourceType: period.resource_type,
      })
      return []
    }

    return [{ period, resourceType }]
  })

  // Resource names in two batched queries rather than one per period. A vendor who
  // blocks their whole fleet for a public holiday used to cost one round trip per row.
  const blockedVehicleIds = Array.from(new Set(
    typedPeriods.filter((p) => p.resourceType === 'vehicle').map((p) => p.period.resource_id)
  ))
  const blockedDriverIds = Array.from(new Set(
    typedPeriods.filter((p) => p.resourceType === 'driver').map((p) => p.period.resource_id)
  ))

  const [blockedVehicles, blockedDrivers] = await Promise.all([
    blockedVehicleIds.length
      ? adminClient.from('vehicles').select('id, make, model').in('id', blockedVehicleIds)
      : Promise.resolve({ data: [], error: null }),
    blockedDriverIds.length
      ? adminClient.from('vendor_drivers').select('id, first_name, last_name').in('id', blockedDriverIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (blockedVehicles.error) {
    console.error('Error loading blocked vehicles:', blockedVehicles.error)
    throw new Error('Failed to load unavailability details')
  }
  if (blockedDrivers.error) {
    console.error('Error loading blocked drivers:', blockedDrivers.error)
    throw new Error('Failed to load unavailability details')
  }

  const resourceNames = new Map<string, string>()
  for (const vehicle of blockedVehicles.data ?? []) {
    resourceNames.set(vehicle.id, `${vehicle.make} ${vehicle.model}`)
  }
  for (const driver of blockedDrivers.data ?? []) {
    resourceNames.set(driver.id, `${driver.first_name} ${driver.last_name}`)
  }

  for (const { period, resourceType } of typedPeriods) {
    // Falls back to the generic label when the resource has since been deleted,
    // matching the previous per-row behaviour.
    const resourceName =
      resourceNames.get(period.resource_id) ??
      (resourceType === 'vehicle' ? 'Vehicle' : 'Driver')

    events.push({
      id: period.id,
      title: `${resourceName} - ${period.reason}`,
      start: new Date(period.start_datetime),
      end: new Date(period.end_datetime),
      resourceId: period.resource_id,
      resourceType,
      type: 'unavailable',
      color: CALENDAR_COLORS.blocked,
      source: 'blocked',
      // A block is a real hold: it is exactly what stops the resource being sold.
      occupies: true,
      status: null,
      details: {
        reason: period.reason,
        notes: period.notes
      }
    })
  }

  return events
}

export async function getVendorResources() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Get vehicles. is_available/is_active are standing flags, not time windows; the
  // fleet timeline draws them as a persistent band across the lane.
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, registration_number, seats, is_available')
    .eq('business_id', vendorApp.id)
    .order('make')

  // Get drivers
  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('id, first_name, last_name, phone, license_number, is_active')
    .eq('vendor_id', vendorApp.id)
    .order('first_name')

  return {
    vehicles: vehicles || [],
    drivers: drivers || []
  }
}

export async function markResourceUnavailable(
  resourceId: string,
  resourceType: 'vehicle' | 'driver',
  startDate: string,
  endDate: string,
  reason: string,
  notes?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid unavailability period')
  }

  if (start >= end) {
    throw new Error('Unavailability must end after it starts')
  }

  // Backdating is meaningless and it does damage: the calendar hides past rows,
  // so a retroactive block becomes invisible while still failing every future
  // availability check against that resource. This is the enforcement point,
  // the calendar's own guard is only a courtesy and can be bypassed.
  if (start < startOfBookingDayUtc()) {
    throw new Error('Cannot mark a resource unavailable for a past date')
  }

  // All three occupancy sources, not two. `AvailabilityService.findConflicts`
  // reads only `resource_schedules` and `resource_unavailability`, so it cannot
  // see `vendor_direct_bookings`: a vendor could mark a vehicle "under
  // maintenance" straight over a live offline booking and the insert succeeded
  // silently. This is the same engine the direct-booking create and update paths
  // use, so "busy" has one definition.
  //
  // Throws if availability cannot be determined, so a database failure is never
  // reported to the vendor as availability.
  const busy = await getBusyResourceWindows({
    vendorId: vendorApp.id,
    resourceIds: [resourceId],
    start,
    end,
  })

  if (busy.length > 0) {
    const noun = resourceType === 'vehicle' ? 'This vehicle' : 'This driver'
    const alreadyBlocked = busy.every((window) => window.source === 'unavailability')

    throw new Error(
      alreadyBlocked
        ? `${noun} is already marked unavailable for part of that period: ${busy.map((w) => w.label).join('; ')}`
        : `${noun} is committed during that period: ${busy.map((w) => w.label).join('; ')}`
    )
  }

  // Mark as unavailable
  const success = await AvailabilityService.markUnavailable(
    resourceId,
    resourceType,
    vendorApp.id,
    start,
    end,
    reason,
    notes
  )

  if (!success) {
    throw new Error('Failed to mark resource as unavailable')
  }

  revalidatePath('/vendor/availability')

  return { success: true }
}

export async function removeUnavailability(unavailabilityId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // The past is a record, not a worklist. Deleting a maintenance window that has
  // already happened would erase the only history of it in the product.
  const { data: existing, error: fetchError } = await supabase
    .from('resource_unavailability')
    .select('start_datetime')
    .eq('id', unavailabilityId)
    .eq('vendor_id', vendorApp.id)
    .single()

  if (fetchError || !existing) {
    console.error('Error loading unavailability:', fetchError)
    throw new Error('Unavailability period not found')
  }

  if (new Date(existing.start_datetime) < startOfBookingDayUtc()) {
    throw new Error('Past unavailability is a record and cannot be removed')
  }

  // Delete unavailability (RLS will ensure vendor can only delete their own)
  const { error } = await supabase
    .from('resource_unavailability')
    .delete()
    .eq('id', unavailabilityId)
    .eq('vendor_id', vendorApp.id)

  if (error) {
    console.error('Error removing unavailability:', error)
    throw new Error('Failed to remove unavailability')
  }

  revalidatePath('/vendor/availability')

  return { success: true }
}

export async function checkResourceAvailability(
  resourceId: string,
  resourceType: 'vehicle' | 'driver',
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  const { schedules, unavailability } = await AvailabilityService.findConflicts(
    resourceId,
    resourceType,
    new Date(startDate),
    new Date(endDate)
  )

  return {
    available: schedules.length === 0 && unavailability.length === 0,
    conflicts: [...schedules, ...unavailability]
  }
}