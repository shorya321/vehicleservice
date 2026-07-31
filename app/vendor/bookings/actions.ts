'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AvailabilityService } from '@/lib/availability/service'
import { getBookingFromAssignment } from '@/lib/bookings/unified-service'
import { parseDurationHours, tripEndFrom } from '@/lib/vendor/bookings/duration'
import {
  findResourceConflicts,
  getBusyResourceWindows,
} from '@/lib/vendor/direct-bookings/availability'
import { sendDriverBookingAssignmentEmail } from '@/lib/email/services/driver-emails'
import { sendBookingDriverAssignedEmail } from '@/lib/email/services/booking-emails'
import {
  sendBusinessCustomerDriverAssignedEmail,
  sendBusinessDriverAssignedEmail,
} from '@/lib/email/services/business-emails'
import { toBookingTz } from '@/lib/utils/timezone'

export interface VendorBooking {
  id: string
  booking_id: string
  vendor_id: string
  driver_id: string | null
  vehicle_id: string | null
  status: string
  assigned_at: string
  accepted_at: string | null
  /** Hours the vehicle and driver are held from pickup. Null on assignments never accepted. */
  estimated_duration_hours: number | null
  notes: string | null
  booking: {
    id: string
    booking_number: string
    trip_number: string | null
    pickup_datetime: string
    pickup_address: string
    dropoff_address: string
    passenger_count: number
    luggage_count: number | null
    total_price: number
    booking_status: string
    payment_status: string
    customer_notes: string | null
    booking_passengers: Array<{
      id: string
      first_name: string
      last_name: string
      email: string | null
      phone: string | null
      is_primary: boolean
    }>
    customer_name?: string
    customer_email?: string | null
    customer_phone?: string | null
    vehicle_type: {
      id: string
      name: string
      passenger_capacity: number
      category?: {
        id: string
        name: string
      } | null
    } | null
  }
  driver?: {
    id: string
    first_name: string
    last_name: string
    phone: string
    license_number: string
  } | null
  vehicle?: {
    id: string
    make: string
    model: string
    year: number
    registration_number: string
    seats: number | null
  } | null
}

export interface BookingFilters {
  search?: string
  status?: string
  sortBy?: string
  startDate?: string
  endDate?: string
}

export async function getVendorAssignedBookings(filters?: BookingFilters) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application for current user using admin client to bypass RLS
  const { data: vendorApp, error: vendorError } = await adminClient
    .from('vendor_applications')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  if (vendorError) {
    console.error('Error fetching vendor application:', vendorError)
    throw new Error('Vendor application not found')
  }

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Build query with filters
  let query = adminClient
    .from('booking_assignments')
    .select(`
      id,
      booking_id,
      business_booking_id,
      vendor_id,
      driver_id,
      vehicle_id,
      status,
      assigned_at,
      accepted_at,
      estimated_duration_hours,
      notes,
      driver:vendor_drivers(
        id,
        first_name,
        last_name,
        phone,
        license_number
      ),
      vehicle:vehicles(
        id,
        make,
        model,
        year,
        registration_number,
        seats
      )
    `)
    .eq('vendor_id', vendorApp.id)

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'newest'
  switch (sortBy) {
    case 'oldest':
      query = query.order('assigned_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('assigned_at', { ascending: false })
      break
  }

  const { data: assignments, error } = await query

  if (error) {
    console.error('Error fetching vendor bookings:', error)
    throw new Error('Failed to fetch assigned bookings')
  }

  // Fetch booking details for each assignment using unified service
  console.log(`📋 Processing ${assignments?.length || 0} assignments for vendor`)

  const vendorBookings = await Promise.all(
    (assignments || []).map(async (assignment) => {
      const assignmentType = assignment.booking_id ? 'customer' : assignment.business_booking_id ? 'business' : 'unknown'
      console.log(`🔍 Processing assignment ${assignment.id} - Type: ${assignmentType}, booking_id: ${assignment.booking_id}, business_booking_id: ${assignment.business_booking_id}`)

      // Use unified service to get booking details (handles both customer and business)
      const booking = await getBookingFromAssignment(assignment.id)

      if (!booking) {
        console.error(`❌ Booking not found for assignment ${assignment.id} (Type: ${assignmentType})`)
        return null
      }

      console.log(`✅ Successfully fetched ${booking.bookingType} booking ${booking.id} for assignment ${assignment.id}`)

      // Get booking passengers if it's a customer booking
      let bookingPassengers = []
      if (booking.bookingType === 'customer') {
        const { data: passengers } = await adminClient
          .from('booking_passengers')
          .select('id, first_name, last_name, email, phone, is_primary')
          .eq('booking_id', booking.id)
          .order('is_primary', { ascending: false })

        bookingPassengers = passengers || []
      }

      // Transform to VendorBooking format
      return {
        id: assignment.id,
        booking_id: booking.id, // Can be either customer or business booking ID
        vendor_id: assignment.vendor_id,
        driver_id: assignment.driver_id,
        vehicle_id: assignment.vehicle_id,
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        accepted_at: assignment.accepted_at,
        estimated_duration_hours: assignment.estimated_duration_hours,
        notes: assignment.notes,
        booking: {
          id: booking.id,
          booking_number: booking.bookingNumber,
          trip_number: booking.tripNumber,
          pickup_datetime: booking.pickupDatetime,
          pickup_address: booking.pickupAddress || '',
          dropoff_address: booking.dropoffAddress || '',
          passenger_count: booking.passengerCount,
          luggage_count: booking.luggageCount,
          total_price: booking.totalPrice,
          booking_status: booking.bookingStatus,
          payment_status: 'pending', // Business bookings don't have payment_status
          customer_notes: booking.customerNotes,
          booking_passengers: bookingPassengers,
          customer_name: booking.customerName,
          customer_email: booking.customerEmail,
          customer_phone: booking.customerPhone,
          vehicle_type: booking.vehicleTypes ? {
            id: booking.vehicleTypeId,
            name: booking.vehicleTypes.name,
            passenger_capacity: booking.vehicleTypes.passengerCapacity,
            category: booking.vehicleTypes.vehicleCategories ? {
              id: booking.vehicleTypes.vehicleCategories.name,
              name: booking.vehicleTypes.vehicleCategories.name
            } : null
          } : null
        },
        driver: assignment.driver,
        vehicle: assignment.vehicle
      } as VendorBooking
    })
  )

  // Filter out any null entries (bookings that couldn't be found)
  let filteredBookings = vendorBookings.filter(b => b !== null) as VendorBooking[]

  // Apply client-side filters (for fields in the booking table)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredBookings = filteredBookings.filter(b =>
      b.booking.booking_number.toLowerCase().includes(searchLower) ||
      b.booking.trip_number?.toLowerCase().includes(searchLower) ||
      b.booking.customer_name?.toLowerCase().includes(searchLower) ||
      b.booking.customer_email?.toLowerCase().includes(searchLower) ||
      b.booking.customer_phone?.includes(filters.search)
    )
  }

  // Apply date range filter (pickup_datetime)
  if (filters?.startDate) {
    const startDate = new Date(filters.startDate)
    filteredBookings = filteredBookings.filter(b =>
      new Date(b.booking.pickup_datetime) >= startDate
    )
  }

  if (filters?.endDate) {
    const endDate = new Date(filters.endDate)
    endDate.setHours(23, 59, 59, 999) // End of day
    filteredBookings = filteredBookings.filter(b =>
      new Date(b.booking.pickup_datetime) <= endDate
    )
  }

  // Apply pickup date sorting if specified
  if (filters?.sortBy === 'pickup_asc') {
    filteredBookings.sort((a, b) =>
      new Date(a.booking.pickup_datetime).getTime() - new Date(b.booking.pickup_datetime).getTime()
    )
  } else if (filters?.sortBy === 'pickup_desc') {
    filteredBookings.sort((a, b) =>
      new Date(b.booking.pickup_datetime).getTime() - new Date(a.booking.pickup_datetime).getTime()
    )
  }

  return filteredBookings
}

export async function getVendorDrivers() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get vendor application for current user
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }
  
  // Get drivers
  const { data: drivers, error } = await supabase
    .from('vendor_drivers')
    .select('*')
    .eq('vendor_id', vendorApp.id)
    .eq('is_active', true)
    .eq('is_available', true)
    .order('first_name')
  
  if (error) {
    console.error('Error fetching drivers:', error)
    throw new Error('Failed to fetch drivers')
  }
  
  return drivers || []
}

export async function getVendorVehicles() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get vendor application for current user
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }
  
  // Get vehicles
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('business_id', vendorApp.id)
    .eq('is_available', true)
    .order('make')
  
  if (error) {
    console.error('Error fetching vehicles:', error)
    throw new Error('Failed to fetch vehicles')
  }
  
  return vehicles || []
}

export async function acceptAndAssignResources(
  assignmentId: string,
  driverId: string,
  vehicleId: string,
  durationHours?: number
) {
  // Never trust the browser's number: the database CHECK is the last line, not the first.
  const holdHours = parseDurationHours(durationHours)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application for current user
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Get booking details using unified service
  const booking = await getBookingFromAssignment(assignmentId)

  if (!booking) {
    throw new Error('Booking not found')
  }

  // Get assignment details
  const { data: assignment } = await adminClient
    .from('booking_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (!assignment) {
    throw new Error('Assignment not found')
  }

  // Verify driver belongs to vendor
  const { data: driverCheck, error: driverError } = await supabase
    .from('vendor_drivers')
    .select('id, vendor_id, first_name, last_name, email, phone')
    .eq('id', driverId)
    .single()

  if (driverError || !driverCheck) {
    console.error('Driver validation error:', {
      driverId,
      vendorId: vendorApp.id,
      error: driverError
    })
    throw new Error('Selected driver not found. Please refresh and try again.')
  }

  if (driverCheck.vendor_id !== vendorApp.id) {
    console.error('Driver ownership mismatch:', {
      driverId,
      driverVendorId: driverCheck.vendor_id,
      currentVendorId: vendorApp.id
    })
    throw new Error('Selected driver does not belong to your vendor account')
  }

  // Verify vehicle belongs to vendor
  const { data: vehicleCheck, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, business_id, make, model')
    .eq('id', vehicleId)
    .single()

  if (vehicleError || !vehicleCheck) {
    console.error('Vehicle validation error:', {
      vehicleId,
      vendorId: vendorApp.id,
      error: vehicleError
    })
    throw new Error('Selected vehicle not found. Please refresh and try again.')
  }

  if (vehicleCheck.business_id !== vendorApp.id) {
    console.error('Vehicle ownership mismatch:', {
      vehicleId,
      vehicleBusinessId: vehicleCheck.business_id,
      currentVendorId: vendorApp.id
    })
    throw new Error('Selected vehicle does not belong to your vendor account')
  }

  // Verify assignment belongs to vendor
  const { data: assignmentCheck, error: assignmentError } = await adminClient
    .from('booking_assignments')
    .select('vendor_id, status')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignmentCheck) {
    console.error('Assignment validation error:', {
      assignmentId,
      vendorId: vendorApp.id,
      error: assignmentError
    })
    throw new Error('Assignment not found. Please refresh and try again.')
  }

  if (assignmentCheck.vendor_id !== vendorApp.id) {
    console.error('Assignment ownership mismatch:', {
      assignmentId,
      assignmentVendorId: assignmentCheck.vendor_id,
      currentVendorId: vendorApp.id
    })
    throw new Error('This assignment does not belong to your vendor account')
  }

  // 'accepted' is allowed as well as 'pending': "Change Assignment" re-runs this action to
  // swap the driver or vehicle on a job the vendor already took. Anything else is closed,
  // and accepting it from a stale tab would re-book resources for a dead booking.
  if (assignmentCheck.status !== 'pending' && assignmentCheck.status !== 'accepted') {
    throw new Error(
      `This booking is no longer open (${assignmentCheck.status}). Refresh your bookings list.`
    )
  }

  console.log('Assignment validation successful:', {
    assignmentId,
    vendorId: vendorApp.id,
    driverId,
    driverName: `${driverCheck.first_name} ${driverCheck.last_name}`,
    vehicleId,
    vehicle: `${vehicleCheck.make} ${vehicleCheck.model}`
  })

  // The hold this acceptance creates: pickup → pickup + the hours the vendor chose.
  const pickupTime = new Date(booking.pickupDatetime)
  const estimatedEndTime = tripEndFrom(pickupTime, holdHours)

  // Nothing at the database level stops the same driver or vehicle being held twice —
  // resource_schedules has no exclusion constraint — so the overlap is checked here, before
  // anything is written. Excluding this assignment lets a vendor re-assign or re-time a
  // booking without it blocking itself.
  const conflicts = await findResourceConflicts({
    vendorId: vendorApp.id,
    vehicleId,
    driverId,
    start: pickupTime,
    end: estimatedEndTime,
    excludeAssignmentId: assignmentId,
  })

  if (conflicts.vehicle.length > 0 || conflicts.driver.length > 0) {
    const blocking = [
      conflicts.vehicle[0] && `Vehicle is busy: ${conflicts.vehicle[0].label}`,
      conflicts.driver[0] && `Driver is busy: ${conflicts.driver[0].label}`,
    ].filter(Boolean)

    throw new Error(
      `${blocking.join('. ')}. Pick another driver or vehicle, or shorten the duration.`
    )
  }

  // Update assignment
  const { error } = await supabase
    .from('booking_assignments')
    .update({
      driver_id: driverId,
      vehicle_id: vehicleId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      estimated_duration_hours: holdHours
    })
    .eq('id', assignmentId)
    .eq('vendor_id', vendorApp.id) // Ensure vendor can only update their own assignments

  if (error) {
    console.error('Failed to update booking assignment - Full error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      assignmentId,
      driverId,
      vehicleId,
      vendorId: vendorApp.id,
      status: 'accepted'
    })
    throw new Error(`Failed to accept and assign resources: ${error.message}`)
  }

  // Create schedule entries for both driver and vehicle.
  //
  // Deliberately non-fatal: the assignment row is already accepted, so throwing here would
  // tell the vendor the acceptance failed when it did not. But a booking holding nothing is
  // exactly the double-booking this feature exists to prevent, so the failure is reported
  // back and surfaced as a warning instead of being swallowed.
  let scheduleWarning: string | undefined

  try {
    const created = await AvailabilityService.createSchedule(
      assignmentId,
      vendorApp.id,
      vehicleId,
      driverId,
      pickupTime,
      estimatedEndTime
    )

    if (!created) {
      scheduleWarning =
        'Booking accepted, but the vehicle and driver could not be reserved. Set the duration again from the bookings list.'
    }
  } catch (scheduleError) {
    console.error('Error creating schedule:', scheduleError)
    scheduleWarning =
      'Booking accepted, but the vehicle and driver could not be reserved. Set the duration again from the bookings list.'
  }

  // Send driver assignment email (non-blocking)
  try {
    if (driverCheck.email) {
      const { data: vendorInfo } = await adminClient
        .from('vendor_applications')
        .select('business_name')
        .eq('id', vendorApp.id)
        .single()

      const { data: vehicleTypeData } = await adminClient
        .from('vehicle_types')
        .select('name, vehicle_categories(name)')
        .eq('id', booking.vehicleTypeId)
        .single()

      const { format } = await import('date-fns')
      const pickupDt = toBookingTz(booking.pickupDatetime)

      await sendDriverBookingAssignmentEmail({
        driverName: `${driverCheck.first_name} ${driverCheck.last_name}`,
        driverEmail: driverCheck.email,
        bookingReference: booking.bookingNumber,
        tripNumber: booking.tripNumber || undefined,
        customerName: booking.customerName,
        vehicleCategory: (vehicleTypeData as any)?.vehicle_categories?.name || 'Vehicle',
        vehicleType: vehicleTypeData?.name || 'Vehicle',
        pickupLocation: booking.pickupAddress || 'TBD',
        dropoffLocation: booking.dropoffAddress || 'TBD',
        pickupDate: format(pickupDt, 'MMMM d, yyyy'),
        pickupTime: format(pickupDt, 'h:mm a'),
        vendorName: vendorInfo?.business_name || 'Your Company',
      })
    }
  } catch (driverEmailError) {
    console.error('Failed to send driver assignment email (non-critical):', driverEmailError)
  }

  // Send driver contact details to the customer (non-blocking).
  // Business bookings notify both the passenger and the business account.
  try {
    const { format } = await import('date-fns')
    const pickupDt = toBookingTz(booking.pickupDatetime)

    const tripDetails = {
      bookingReference: booking.bookingNumber,
      tripNumber: booking.tripNumber || undefined,
      driverName: `${driverCheck.first_name} ${driverCheck.last_name}`,
      driverPhone: driverCheck.phone,
      pickupDate: format(pickupDt, 'MMMM d, yyyy'),
      pickupTime: format(pickupDt, 'h:mm a'),
    }

    if (booking.bookingType === 'customer') {
      if (booking.customerEmail) {
        await sendBookingDriverAssignedEmail({
          ...tripDetails,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
        })
      }
    } else {
      if (booking.customerEmail) {
        await sendBusinessCustomerDriverAssignedEmail({
          ...tripDetails,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
        })
      }

      const { data: businessBooking } = await adminClient
        .from('business_bookings')
        .select(
          'business_account:business_accounts!business_bookings_business_account_id_fkey(business_name, business_email)'
        )
        .eq('id', booking.id)
        .single()

      const businessAccount = (businessBooking as any)?.business_account
      if (businessAccount?.business_email) {
        await sendBusinessDriverAssignedEmail({
          ...tripDetails,
          businessName: businessAccount.business_name,
          businessEmail: businessAccount.business_email,
          passengerName: booking.customerName,
          bookingId: booking.id,
        })
      }
    }
  } catch (customerEmailError) {
    console.error(
      'Failed to send customer driver-assignment email (non-critical):',
      customerEmailError
    )
  }

  // Revalidate paths - don't let cache revalidation failures block the response
  try {
    revalidatePath('/vendor/bookings')
    revalidatePath('/vendor/availability')
    revalidatePath('/admin/bookings')
    // Revalidate booking detail pages (works for both customer and business)
    revalidatePath(`/admin/bookings/${booking.id}`)
    if (booking.bookingType === 'customer') {
      revalidatePath('/account')
    }
    console.log('Cache revalidation successful for assignment:', assignmentId)
  } catch (revalidationError) {
    // Log but don't throw - revalidation errors shouldn't fail the action
    console.error('Cache revalidation error (non-critical):', {
      error: revalidationError,
      assignmentId,
      bookingId: booking.id
    })
  }

  return {
    success: true,
    durationHours: holdHours,
    releaseAt: estimatedEndTime.toISOString(),
    warning: scheduleWarning,
  }
}

export async function rejectAssignment(
  assignmentId: string,
  reason?: string
) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application for current user
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Get booking details using unified service
  const booking = await getBookingFromAssignment(assignmentId)

  // Only an untouched assignment can be rejected. Rejecting one that was already accepted,
  // cancelled or completed from a stale tab would rewrite a closed record.
  const { data: rejectCheck } = await adminClient
    .from('booking_assignments')
    .select('status')
    .eq('id', assignmentId)
    .eq('vendor_id', vendorApp.id)
    .single()

  if (!rejectCheck) {
    throw new Error('Assignment not found. Please refresh and try again.')
  }

  if (rejectCheck.status !== 'pending') {
    throw new Error(
      `This booking can no longer be rejected (${rejectCheck.status}). Refresh your bookings list.`
    )
  }

  // Update assignment with rejection details
  const { error } = await supabase
    .from('booking_assignments')
    .update({
      status: 'rejected',
      rejection_reason: reason || 'Rejected by vendor',
      rejected_at: new Date().toISOString(),
      notes: reason ? `Rejected: ${reason}` : 'Rejected by vendor'
    })
    .eq('id', assignmentId)
    .eq('vendor_id', vendorApp.id) // Ensure vendor can only update their own assignments

  if (error) {
    console.error('Error rejecting assignment:', error)
    throw new Error('Failed to reject assignment')
  }

  revalidatePath('/vendor/bookings')
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  if (booking) {
    revalidatePath(`/admin/bookings/${booking.id}`)
    if (booking.bookingType === 'customer') {
      revalidatePath('/account')
    }
  }

  return { success: true }
}

export async function checkResourceAvailabilityForBooking(
  assignmentId: string,
  durationHours?: number
) {
  const holdHours = parseDurationHours(durationHours)
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
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Get booking details using unified service
  const booking = await getBookingFromAssignment(assignmentId)

  if (!booking) {
    throw new Error('Booking not found')
  }

  const pickupTime = new Date(booking.pickupDatetime)
  const estimatedEndTime = tripEndFrom(pickupTime, holdHours)

  // Get all drivers with availability status
  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('*')
    .eq('vendor_id', vendorApp.id)
    .eq('is_active', true)

  // Get category ID from vehicle type
  const { data: vehicleType } = await adminClient
    .from('vehicle_types')
    .select('category_id')
    .eq('id', booking.vehicleTypeId)
    .single()

  // Get all vehicles with availability status - filtered by booking category
  const bookingCategoryId = vehicleType?.category_id
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('business_id', vendorApp.id)
    .eq('category_id', bookingCategoryId)

  // Every busy window for the whole fleet in one batched read, from the module that also
  // backs direct bookings — so "busy" means the same thing on both sides, including direct
  // bookings, which the old per-resource queries here never looked at. This assignment is
  // excluded so re-assigning or re-timing a booking is not blocked by its own hold.
  const busyWindows = await getBusyResourceWindows({
    vendorId: vendorApp.id,
    resourceIds: [
      ...(drivers || []).map((driver) => driver.id),
      ...(vehicles || []).map((vehicle) => vehicle.id),
    ],
    start: pickupTime,
    end: estimatedEndTime,
    excludeAssignmentId: assignmentId,
  })

  const conflictsByResource = new Map<string, typeof busyWindows>()
  for (const window of busyWindows) {
    const existing = conflictsByResource.get(window.resourceId)
    if (existing) {
      existing.push(window)
    } else {
      conflictsByResource.set(window.resourceId, [window])
    }
  }

  const driversWithAvailability = (drivers || []).map((driver) => {
    const conflicts = conflictsByResource.get(driver.id) ?? []

    return {
      ...driver,
      availability: {
        // Flag first, exactly as before: a driver not flagged available is never offered.
        available: !driver.is_available ? false : conflicts.length === 0,
        conflicts,
      },
    }
  })

  const vehiclesWithAvailability = (vehicles || []).map((vehicle) => {
    const conflicts = conflictsByResource.get(vehicle.id) ?? []

    return {
      ...vehicle,
      availability: {
        available: !vehicle.is_available ? false : conflicts.length === 0,
        conflicts,
      },
    }
  })

  return {
    durationHours: holdHours,
    bookingTime: pickupTime.toISOString(),
    estimatedEndTime: estimatedEndTime.toISOString(),
    drivers: driversWithAvailability,
    vehicles: vehiclesWithAvailability
  }
}

/**
 * Change how long an already-accepted booking holds its vehicle and driver.
 *
 * A trip that runs longer than the vendor first estimated would otherwise release both
 * resources on time and let them be taken by another booking. This moves the hold's end
 * instead, and refuses when another job already occupies the extended window.
 */
export async function updateAssignmentDuration(
  assignmentId: string,
  durationHours: number
) {
  const holdHours = parseDurationHours(durationHours)
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  const { data: assignment, error: assignmentError } = await adminClient
    .from('booking_assignments')
    .select('id, vendor_id, status, driver_id, vehicle_id, completed_at, cancelled_at, estimated_duration_hours')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) {
    console.error('Assignment lookup failed for duration change:', {
      assignmentId,
      error: assignmentError,
    })
    throw new Error('Assignment not found. Please refresh and try again.')
  }

  if (assignment.vendor_id !== vendorApp.id) {
    console.error('Assignment ownership mismatch on duration change:', {
      assignmentId,
      assignmentVendorId: assignment.vendor_id,
      currentVendorId: vendorApp.id,
    })
    throw new Error('This assignment does not belong to your vendor account')
  }

  if (assignment.status !== 'accepted') {
    throw new Error('Only an accepted booking can have its duration changed.')
  }

  if (assignment.completed_at || assignment.cancelled_at) {
    throw new Error('This booking is already closed, so its resources are already free.')
  }

  if (!assignment.driver_id || !assignment.vehicle_id) {
    throw new Error('Assign a driver and vehicle before setting the duration.')
  }

  const booking = await getBookingFromAssignment(assignmentId)

  if (!booking) {
    throw new Error('Booking not found')
  }

  const pickupTime = new Date(booking.pickupDatetime)
  const releaseAt = tripEndFrom(pickupTime, holdHours)

  // Only *other* jobs may block an extension — this booking's own hold is excluded.
  const conflicts = await findResourceConflicts({
    vendorId: vendorApp.id,
    vehicleId: assignment.vehicle_id,
    driverId: assignment.driver_id,
    start: pickupTime,
    end: releaseAt,
    excludeAssignmentId: assignmentId,
  })

  if (conflicts.vehicle.length > 0 || conflicts.driver.length > 0) {
    const blocking = [
      conflicts.vehicle[0] && `Vehicle is busy: ${conflicts.vehicle[0].label}`,
      conflicts.driver[0] && `Driver is busy: ${conflicts.driver[0].label}`,
    ].filter(Boolean)

    throw new Error(`${blocking.join('. ')}. Choose a shorter duration.`)
  }

  const previousHours = assignment.estimated_duration_hours

  const { error: durationError } = await supabase
    .from('booking_assignments')
    .update({ estimated_duration_hours: holdHours })
    .eq('id', assignmentId)
    .eq('vendor_id', vendorApp.id)

  if (durationError) {
    console.error('Failed to store booking duration:', {
      message: durationError.message,
      assignmentId,
      holdHours,
    })
    throw new Error('Could not save the new duration. Please try again.')
  }

  try {
    const moved = await AvailabilityService.updateScheduleWindow(
      assignmentId,
      pickupTime,
      releaseAt
    )

    // No rows means this booking never got a hold — accepted back when schedule failures
    // were swallowed. Create it now rather than leaving the resources free.
    if (moved === 0) {
      const created = await AvailabilityService.createSchedule(
        assignmentId,
        vendorApp.id,
        assignment.vehicle_id,
        assignment.driver_id,
        pickupTime,
        releaseAt
      )

      if (!created) {
        throw new Error('Could not reserve the vehicle and driver for the new window.')
      }
    }
  } catch (scheduleError) {
    // The stored duration must not claim a window the calendar does not hold, so put it back.
    await supabase
      .from('booking_assignments')
      .update({ estimated_duration_hours: previousHours })
      .eq('id', assignmentId)
      .eq('vendor_id', vendorApp.id)

    console.error('Failed to move schedule window:', { assignmentId, error: scheduleError })
    throw scheduleError instanceof Error
      ? scheduleError
      : new Error('Could not update the booking duration. Please try again.')
  }

  try {
    revalidatePath('/vendor/bookings')
    revalidatePath('/vendor/availability')
    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${booking.id}`)
  } catch (revalidationError) {
    console.error('Cache revalidation error (non-critical):', {
      error: revalidationError,
      assignmentId,
    })
  }

  return {
    success: true,
    durationHours: holdHours,
    releaseAt: releaseAt.toISOString(),
  }
}

export async function completeBooking(assignmentId: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get vendor application for current user
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    throw new Error('Vendor application not found')
  }

  // Get booking details using unified service
  const booking = await getBookingFromAssignment(assignmentId)

  if (!booking) {
    throw new Error('Booking not found')
  }

  // Verify this assignment belongs to the vendor
  const { data: assignment, error: assignmentError } = await adminClient
    .from('booking_assignments')
    .select('vendor_id, status')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) {
    throw new Error('Assignment not found')
  }

  if (assignment.vendor_id !== vendorApp.id) {
    throw new Error('Unauthorized: This assignment does not belong to your vendor account')
  }

  // Only a job the vendor actually took can be completed. Completing a cancelled one from a
  // stale tab would flip the booking back to completed after it was called off.
  if (assignment.status !== 'accepted') {
    throw new Error(
      `This booking can no longer be completed (${assignment.status}). Refresh your bookings list.`
    )
  }

  // Update booking status to completed (handle both customer and business bookings)
  const tableName = booking.bookingType === 'customer' ? 'bookings' : 'business_bookings'
  const { error: updateError } = await adminClient
    .from(tableName)
    .update({
      booking_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', booking.id)

  if (updateError) {
    console.error('Error updating booking status:', updateError)
    throw new Error('Failed to complete booking')
  }

  // Update assignment status to completed with timestamp
  const { error: assignmentUpdateError } = await adminClient
    .from('booking_assignments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', assignmentId)

  if (assignmentUpdateError) {
    console.error('Error updating assignment status:', assignmentUpdateError)
    // Don't throw - booking is already completed, just log the error
  }

  // Free vehicle and driver resources
  await AvailabilityService.removeSchedule(assignmentId)

  revalidatePath('/vendor/bookings')
  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${booking.id}`)
  if (booking.bookingType === 'customer') {
    revalidatePath('/account')
  }

  return { success: true }
}