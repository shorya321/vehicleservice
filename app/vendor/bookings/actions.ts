'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AvailabilityService } from '@/lib/availability/service'
import { getBookingFromAssignment } from '@/lib/bookings/unified-service'

export interface VendorBooking {
  id: string
  booking_id: string
  vendor_id: string
  driver_id: string | null
  vehicle_id: string | null
  status: string
  assigned_at: string
  accepted_at: string | null
  notes: string | null
  booking: {
    id: string
    booking_number: string
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
        notes: assignment.notes,
        booking: {
          id: booking.id,
          booking_number: booking.bookingNumber,
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
  vehicleId: string
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
    .select('id, vendor_id, first_name, last_name')
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
    .select('vendor_id')
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

  console.log('Assignment validation successful:', {
    assignmentId,
    vendorId: vendorApp.id,
    driverId,
    driverName: `${driverCheck.first_name} ${driverCheck.last_name}`,
    vehicleId,
    vehicle: `${vehicleCheck.make} ${vehicleCheck.model}`
  })

  // Update assignment
  const { error } = await supabase
    .from('booking_assignments')
    .update({
      driver_id: driverId,
      vehicle_id: vehicleId,
      status: 'accepted',
      accepted_at: new Date().toISOString()
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

  // Create schedule entries for both driver and vehicle
  const pickupTime = new Date(booking.pickupDatetime)
  const estimatedEndTime = new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000) // Estimate 2 hours for trip

  try {
    await AvailabilityService.createSchedule(
      assignmentId,
      vendorApp.id,
      vehicleId,
      driverId,
      pickupTime,
      estimatedEndTime
    )
  } catch (scheduleError) {
    console.error('Error creating schedule:', scheduleError)
    // Schedule creation failure is not critical, continue
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

  return { success: true }
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
  assignmentId: string
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
  const estimatedEndTime = new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000) // Estimate 2 hours for trip

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

  // Check availability for each driver
  const driversWithAvailability = await Promise.all(
    (drivers || []).map(async (driver) => {
      // Check for conflicts in resource_schedules
      const { data: schedules } = await supabase
        .from('resource_schedules')
        .select('*')
        .eq('resource_id', driver.id)
        .eq('resource_type', 'driver')
        .gte('end_datetime', pickupTime.toISOString())
        .lte('start_datetime', estimatedEndTime.toISOString())

      // Check for unavailability periods
      const { data: unavailability } = await supabase
        .from('resource_unavailability')
        .select('*')
        .eq('resource_id', driver.id)
        .eq('resource_type', 'driver')
        .gte('end_datetime', pickupTime.toISOString())
        .lte('start_datetime', estimatedEndTime.toISOString())

      const isAvailable = !driver.is_available ? false :
                          (schedules?.length === 0 && unavailability?.length === 0)

      return {
        ...driver,
        availability: {
          available: isAvailable,
          conflicts: [...(schedules || []), ...(unavailability || [])]
        }
      }
    })
  )

  // Check availability for each vehicle
  const vehiclesWithAvailability = await Promise.all(
    (vehicles || []).map(async (vehicle) => {
      // Check for conflicts in resource_schedules
      const { data: schedules } = await supabase
        .from('resource_schedules')
        .select('*')
        .eq('resource_id', vehicle.id)
        .eq('resource_type', 'vehicle')
        .gte('end_datetime', pickupTime.toISOString())
        .lte('start_datetime', estimatedEndTime.toISOString())

      // Check for unavailability periods
      const { data: unavailability } = await supabase
        .from('resource_unavailability')
        .select('*')
        .eq('resource_id', vehicle.id)
        .eq('resource_type', 'vehicle')
        .gte('end_datetime', pickupTime.toISOString())
        .lte('start_datetime', estimatedEndTime.toISOString())

      const isAvailable = !vehicle.is_available ? false :
                          (schedules?.length === 0 && unavailability?.length === 0)

      return {
        ...vehicle,
        availability: {
          available: isAvailable,
          conflicts: [...(schedules || []), ...(unavailability || [])]
        }
      }
    })
  )

  return {
    bookingTime: pickupTime.toISOString(),
    estimatedEndTime: estimatedEndTime.toISOString(),
    drivers: driversWithAvailability,
    vehicles: vehiclesWithAvailability
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
    .select('vendor_id')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) {
    throw new Error('Assignment not found')
  }

  if (assignment.vendor_id !== vendorApp.id) {
    throw new Error('Unauthorized: This assignment does not belong to your vendor account')
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