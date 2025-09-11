'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    customer: {
      id: string
      full_name: string | null
      email: string
      phone: string | null
    } | null
    vehicle_type: {
      id: string
      name: string
      passenger_capacity: number
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
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get vendor application for current user
  const { data: vendorApp, error: vendorError } = await supabase
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
  
  // Get assigned bookings
  const { data: assignments, error } = await supabase
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
        customer:profiles(
          id,
          full_name,
          email,
          phone
        ),
        vehicle_type:vehicle_types(
          id,
          name,
          passenger_capacity
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
  
  revalidatePath('/vendor/bookings')
  
  return { success: true }
}

export async function rejectAssignment(
  assignmentId: string,
  reason?: string
) {
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
  
  // Update assignment
  const { error } = await supabase
    .from('booking_assignments')
    .update({
      status: 'rejected',
      notes: reason ? `Rejected: ${reason}` : 'Rejected by vendor'
    })
    .eq('id', assignmentId)
    .eq('vendor_id', vendorApp.id) // Ensure vendor can only update their own assignments
  
  if (error) {
    console.error('Error rejecting assignment:', error)
    throw new Error('Failed to reject assignment')
  }
  
  revalidatePath('/vendor/bookings')
  
  return { success: true }
}