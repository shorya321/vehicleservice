'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { AvailabilityService } from '@/lib/availability/service'

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

export async function getVendorAssignedBookings() {
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

  // Get assigned bookings using admin client to bypass RLS issues
  const { data: assignments, error } = await adminClient
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(
        id,
        booking_number,
        pickup_datetime,
        pickup_address,
        dropoff_address,
        passenger_count,
        luggage_count,
        total_price,
        booking_status,
        payment_status,
        customer_notes,
        booking_passengers(
          id,
          first_name,
          last_name,
          email,
          phone,
          is_primary
        ),
        vehicle_type:vehicle_types(
          id,
          name,
          passenger_capacity,
          category:vehicle_categories(
            id,
            name
          )
        )
      ),
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
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('Error fetching vendor bookings:', error)
    throw new Error('Failed to fetch assigned bookings')
  }

  return (assignments || []) as VendorBooking[]
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

  // Get booking details to create schedule
  const { data: assignment } = await adminClient
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(
        pickup_datetime,
        dropoff_address,
        pickup_address
      )
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment || !assignment.booking) {
    throw new Error('Booking not found')
  }

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
    console.error('Error updating assignment:', error)
    throw new Error('Failed to accept and assign resources')
  }

  // Create schedule entries for both driver and vehicle
  const pickupTime = new Date(assignment.booking.pickup_datetime)
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

  revalidatePath('/vendor/bookings')
  revalidatePath('/vendor/availability')
  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${assignment.booking_id}`)
  revalidatePath(`/customer/bookings/${assignment.booking_id}`)

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

  // Get the booking_id for this assignment
  const { data: assignment } = await adminClient
    .from('booking_assignments')
    .select('booking_id')
    .eq('id', assignmentId)
    .single()

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
  if (assignment?.booking_id) {
    revalidatePath(`/admin/bookings/${assignment.booking_id}`)
    revalidatePath(`/customer/bookings/${assignment.booking_id}`)
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

  // Get booking details from assignment
  const { data: assignment } = await adminClient
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(
        pickup_datetime,
        dropoff_address,
        pickup_address,
        vehicle_type:vehicle_types(
          id,
          category_id
        )
      )
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment || !assignment.booking) {
    throw new Error('Booking not found')
  }

  const pickupTime = new Date(assignment.booking.pickup_datetime)
  const estimatedEndTime = new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000) // Estimate 2 hours for trip

  // Get all drivers with availability status
  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('*')
    .eq('vendor_id', vendorApp.id)
    .eq('is_active', true)

  // Get all vehicles with availability status - filtered by booking category
  const bookingCategoryId = assignment.booking?.vehicle_type?.category_id
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

  // Verify this assignment belongs to the vendor
  const { data: assignment, error: assignmentError } = await adminClient
    .from('booking_assignments')
    .select('booking_id, vendor_id')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) {
    throw new Error('Assignment not found')
  }

  if (assignment.vendor_id !== vendorApp.id) {
    throw new Error('Unauthorized: This assignment does not belong to your vendor account')
  }

  // Update booking status to completed
  const { error: updateError } = await adminClient
    .from('bookings')
    .update({
      booking_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', assignment.booking_id)

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
  revalidatePath(`/admin/bookings/${assignment.booking_id}`)
  revalidatePath(`/customer/bookings/${assignment.booking_id}`)

  return { success: true }
}