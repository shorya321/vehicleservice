'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export interface RouteDetails {
  id: string
  route_name: string
  distance_km: number
  estimated_duration_minutes: number
  base_price: number
  origin: {
    id: string
    name: string
    city: string | null
    country_code: string
  }
  destination: {
    id: string
    name: string
    city: string | null
    country_code: string
  }
}

export interface VehicleTypeDetails {
  id: string
  name: string
  slug: string
  description: string | null
  passenger_capacity: number
  luggage_capacity: number
  image_url: string | null
  price: number
}

export async function getRouteById(routeId: string): Promise<RouteDetails | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      distance_km,
      estimated_duration_minutes,
      base_price,
      origin:origin_location_id(
        id,
        name,
        city,
        country_code
      ),
      destination:destination_location_id(
        id,
        name,
        city,
        country_code
      )
    `)
    .eq('id', routeId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('Error fetching route:', error)
    return null
  }

  return data as RouteDetails
}

export async function getVehicleType(vehicleTypeId: string): Promise<VehicleTypeDetails | null> {
  const supabase = createAdminClient()
  
  // Get vehicle type with pricing
  const { data, error } = await supabase
    .from('vehicle_types')
    .select(`
      id,
      name,
      slug,
      description,
      passenger_capacity,
      luggage_capacity,
      image_url
    `)
    .eq('id', vehicleTypeId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('Error fetching vehicle type:', error)
    return null
  }

  // For now, return with a default price
  // In production, you'd fetch the actual pricing from route_vehicle_type_pricing
  return {
    ...data,
    price: 50 // Default price, should be fetched from pricing table
  } as VehicleTypeDetails
}

// Booking creation schema
const bookingSchema = z.object({
  routeId: z.string().uuid(),
  vehicleTypeId: z.string().uuid(),
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
  pickupDate: z.string(),
  pickupTime: z.string(),
  passengerCount: z.number().min(1).max(50),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  specialRequests: z.string().optional(),
  childSeats: z.object({
    infant: z.number().min(0).max(4),
    booster: z.number().min(0).max(4)
  }),
  extraLuggage: z.boolean(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  paymentMethod: z.enum(['card', 'cash'])
})

export type BookingFormData = z.infer<typeof bookingSchema>

export async function createBooking(formData: BookingFormData) {
  // Get authenticated user first using regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required to create booking')
  }
  
  // Use admin client for database operations to bypass RLS
  const adminClient = createAdminClient()
  
  // Validate the form data
  const validatedData = bookingSchema.parse(formData)
  
  // Generate booking number
  const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
  
  // Combine date and time for pickup datetime
  const pickupDateTime = new Date(`${validatedData.pickupDate}T${validatedData.pickupTime}`)
  
  // Calculate prices (simplified - in production, fetch actual prices)
  const basePrice = 50 // Should fetch from route_vehicle_type_pricing
  const childSeatPrice = (validatedData.childSeats.infant + validatedData.childSeats.booster) * 10
  const extraLuggagePrice = validatedData.extraLuggage ? 15 : 0
  const amenitiesPrice = childSeatPrice + extraLuggagePrice
  const totalPrice = basePrice + amenitiesPrice
  
  // Start a transaction
  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      route_id: validatedData.routeId,
      customer_id: user.id,
      pickup_address: validatedData.pickupAddress,
      dropoff_address: validatedData.dropoffAddress,
      pickup_datetime: pickupDateTime.toISOString(),
      passenger_count: validatedData.passengerCount,
      base_price: basePrice,
      amenities_price: amenitiesPrice,
      total_price: totalPrice,
      status: 'pending',
      payment_status: validatedData.paymentMethod === 'cash' ? 'pending' : 'processing',
      customer_notes: validatedData.specialRequests || null
    })
    .select()
    .single()
  
  if (bookingError || !booking) {
    console.error('Error creating booking:', bookingError)
    console.error('Booking data attempted:', {
      booking_number: bookingNumber,
      route_id: validatedData.routeId,
      customer_id: user.id,
      pickup_address: validatedData.pickupAddress,
      dropoff_address: validatedData.dropoffAddress,
      pickup_datetime: pickupDateTime.toISOString(),
      passenger_count: validatedData.passengerCount,
      base_price: basePrice,
      amenities_price: amenitiesPrice,
      total_price: totalPrice,
      status: 'pending',
      payment_status: validatedData.paymentMethod === 'cash' ? 'pending' : 'processing',
      customer_notes: validatedData.specialRequests || null
    })
    throw new Error(`Failed to create booking: ${bookingError?.message || 'Unknown error'}`)
  }
  // Add passenger details
  const { error: passengerError } = await adminClient
    .from('booking_passengers')
    .insert({
      booking_id: booking.id,
      is_primary: true,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone
    })
  
  if (passengerError) {
    console.error('Error adding passenger:', passengerError)
    // In production, you'd want to rollback the booking here
    throw new Error('Failed to add passenger details')
  }
  
  // Add amenities if any
  const amenities = []
  if (validatedData.childSeats.infant > 0) {
    amenities.push({
      booking_id: booking.id,
      amenity_type: 'child_seat_infant',
      quantity: validatedData.childSeats.infant,
      price: validatedData.childSeats.infant * 10
    })
  }
  if (validatedData.childSeats.booster > 0) {
    amenities.push({
      booking_id: booking.id,
      amenity_type: 'child_seat_booster',
      quantity: validatedData.childSeats.booster,
      price: validatedData.childSeats.booster * 10
    })
  }
  if (validatedData.extraLuggage) {
    amenities.push({
      booking_id: booking.id,
      amenity_type: 'extra_luggage',
      quantity: 1,
      price: 15
    })
  }
  
  if (amenities.length > 0) {
    const { error: amenitiesError } = await adminClient
      .from('booking_amenities')
      .insert(amenities)
    
    if (amenitiesError) {
      console.error('Error adding amenities:', amenitiesError)
      // Non-critical error, continue
    }
  }
  
  return {
    success: true,
    bookingNumber: booking.booking_number,
    bookingId: booking.id,
    totalPrice: totalPrice
  }
}