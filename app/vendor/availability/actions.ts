'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvailabilityService } from '@/lib/availability/service'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { revalidatePath } from 'next/cache'

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
  /** Set on booking events only — the resources the booking actually occupies.
   *  The resource filter needs these; resourceType alone cannot express "both". */
  vehicleId?: string | null
  driverId?: string | null
  color?: string
  details?: any
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

  // Create one event per booking (not per resource)
  for (const [assignmentId, groupSchedules] of Object.entries(bookingGroups)) {
    // Use first schedule for timing (all schedules for same booking have same times)
    const firstSchedule = groupSchedules[0]

    // Get booking details (both customer and business bookings)
    const { data: assignment } = await adminClient
      .from('booking_assignments')
      .select(`
        *,
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
        vehicle:vehicles(
          id,
          make,
          model,
          registration_number
        ),
        driver:vendor_drivers(
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (!assignment) continue

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

    events.push({
      id: assignmentId, // Use assignment ID as unique event ID
      title: `Booking #${bookingData?.trip_number || bookingData?.booking_number || 'N/A'}`,
      start: new Date(firstSchedule.start_datetime),
      end: new Date(firstSchedule.end_datetime),
      resourceId: assignmentId, // Use assignment ID
      resourceType: 'booking', // Occupies a vehicle and a driver, not one resource
      type: 'booking',
      // Carried so the resource filter can match a booking against a specific
      // vehicle or driver. Without these it can only ask "is it a booking?" and
      // every booking passes every filter.
      vehicleId: assignment.vehicle?.id ?? null,
      driverId: assignment.driver?.id ?? null,
      color: '#3B82F6', // Blue for bookings
      details: {
        bookingNumber: bookingData?.booking_number,
        customer: bookingData?.customer?.full_name,
        phone: bookingData?.customer?.phone,
        pickup: bookingData?.pickup_address,
        dropoff: bookingData?.dropoff_address,
        status: firstSchedule.status,
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
    })
  }

  // Get unavailability periods
  const unavailability = await AvailabilityService.getVendorUnavailability(
    vendorApp.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  for (const period of unavailability) {
    // resource_type is a plain text column guarded by a CHECK constraint, so the
    // generated type widens it to string. Anything else is corrupt data, not a
    // calendar event.
    const periodResourceType: 'vehicle' | 'driver' | null =
      period.resource_type === 'vehicle' ? 'vehicle'
        : period.resource_type === 'driver' ? 'driver'
        : null

    if (!periodResourceType) {
      console.error('Unavailability row with unexpected resource_type', {
        id: period.id,
        resourceType: period.resource_type,
      })
      continue
    }

    // Get resource name
    let resourceName = ''
    if (periodResourceType === 'vehicle') {
      const { data: vehicle } = await adminClient
        .from('vehicles')
        .select('make, model, registration_number')
        .eq('id', period.resource_id)
        .single()
      resourceName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'
    } else {
      const { data: driver } = await adminClient
        .from('vendor_drivers')
        .select('first_name, last_name')
        .eq('id', period.resource_id)
        .single()
      resourceName = driver ? `${driver.first_name} ${driver.last_name}` : 'Driver'
    }

    events.push({
      id: period.id,
      title: `${resourceName} - ${period.reason}`,
      start: new Date(period.start_datetime),
      end: new Date(period.end_datetime),
      resourceId: period.resource_id,
      resourceType: periodResourceType,
      type: 'unavailable',
      color: '#EF4444', // Red for unavailable
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

  // Get vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, registration_number, seats')
    .eq('business_id', vendorApp.id)
    .order('make')

  // Get drivers
  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('id, first_name, last_name, phone, license_number')
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
  // availability check against that resource. This is the enforcement point —
  // the calendar's own guard is only a courtesy and can be bypassed.
  if (start < startOfBookingDayUtc()) {
    throw new Error('Cannot mark a resource unavailable for a past date')
  }

  // Throws if availability cannot be determined, so a database failure is never
  // reported to the vendor as a booking conflict.
  const conflicts = await AvailabilityService.findConflicts(
    resourceId,
    resourceType,
    start,
    end
  )

  if (conflicts.schedules.length > 0) {
    throw new Error('Resource has bookings during this period')
  }

  if (conflicts.unavailability.length > 0) {
    throw new Error('Resource is already marked unavailable for part of this period')
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