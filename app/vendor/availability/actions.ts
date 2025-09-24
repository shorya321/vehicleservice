'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AvailabilityService } from '@/lib/availability/service'
import { revalidatePath } from 'next/cache'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
  resourceType: 'vehicle' | 'driver'
  type: 'booking' | 'unavailable'
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

  // Get booking details for schedules
  for (const schedule of schedules) {
    // Get booking details
    const { data: assignment } = await adminClient
      .from('booking_assignments')
      .select(`
        *,
        booking:bookings(
          booking_number,
          pickup_address,
          dropoff_address,
          pickup_datetime,
          customer:profiles(full_name, phone)
        )
      `)
      .eq('id', schedule.booking_assignment_id)
      .single()

    // Get resource name
    let resourceName = ''
    if (schedule.resource_type === 'vehicle') {
      const { data: vehicle } = await adminClient
        .from('vehicles')
        .select('make, model, registration_number')
        .eq('id', schedule.resource_id)
        .single()
      resourceName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration_number})` : 'Vehicle'
    } else {
      const { data: driver } = await adminClient
        .from('vendor_drivers')
        .select('first_name, last_name')
        .eq('id', schedule.resource_id)
        .single()
      resourceName = driver ? `${driver.first_name} ${driver.last_name}` : 'Driver'
    }

    events.push({
      id: schedule.id,
      title: `Booking #${assignment?.booking?.booking_number || 'N/A'} - ${resourceName}`,
      start: new Date(schedule.start_datetime),
      end: new Date(schedule.end_datetime),
      resourceId: schedule.resource_id,
      resourceType: schedule.resource_type,
      type: 'booking',
      color: '#3B82F6', // Blue for bookings
      details: {
        bookingNumber: assignment?.booking?.booking_number,
        customer: assignment?.booking?.customer?.full_name,
        phone: assignment?.booking?.customer?.phone,
        pickup: assignment?.booking?.pickup_address,
        dropoff: assignment?.booking?.dropoff_address,
        status: schedule.status
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
    // Get resource name
    let resourceName = ''
    if (period.resource_type === 'vehicle') {
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
      resourceType: period.resource_type,
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

  // Check for conflicts
  const hasConflicts = !(await AvailabilityService.checkAvailability(
    resourceId,
    resourceType,
    new Date(startDate),
    new Date(endDate),
    vendorApp.id
  ))

  if (hasConflicts) {
    throw new Error('Resource has bookings during this period')
  }

  // Mark as unavailable
  const success = await AvailabilityService.markUnavailable(
    resourceId,
    resourceType,
    vendorApp.id,
    new Date(startDate),
    new Date(endDate),
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

  const isAvailable = await AvailabilityService.checkAvailability(
    resourceId,
    resourceType,
    new Date(startDate),
    new Date(endDate),
    vendorApp.id
  )

  const conflicts = await AvailabilityService.getConflicts(
    resourceId,
    resourceType,
    new Date(startDate),
    new Date(endDate)
  )

  return {
    available: isAvailable,
    conflicts: conflicts
  }
}