'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

export async function getLocationDetails(locationId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      city,
      country_code,
      zone_id,
      latitude,
      longitude,
      zones!locations_zone_id_fkey(
        id,
        name
      )
    `)
    .eq('id', locationId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

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

// Addon types for checkout
export interface CheckoutAddon {
  id: string
  name: string
  description: string | null
  icon: string
  price: number
  pricing_type: 'fixed' | 'per_unit'
  max_quantity: number
  category: string
}

export interface CheckoutAddonsByCategory {
  category: string
  addons: CheckoutAddon[]
}

/**
 * Get active addons for customer checkout
 */
export async function getActiveAddons(): Promise<{
  addons: CheckoutAddon[]
  addonsByCategory: CheckoutAddonsByCategory[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('addons')
    .select('id, name, description, icon, price, pricing_type, max_quantity, category')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching addons:', error)
    return { addons: [], addonsByCategory: [] }
  }

  const addons = (data || []) as CheckoutAddon[]

  // Group by category
  const categoryMap = new Map<string, CheckoutAddon[]>()
  addons.forEach((addon) => {
    if (!categoryMap.has(addon.category)) {
      categoryMap.set(addon.category, [])
    }
    categoryMap.get(addon.category)!.push(addon)
  })

  // Define category order
  const categoryOrder = ['Child Safety', 'Luggage', 'Comfort']
  const addonsByCategory: CheckoutAddonsByCategory[] = []

  categoryOrder.forEach((cat) => {
    if (categoryMap.has(cat)) {
      addonsByCategory.push({
        category: cat,
        addons: categoryMap.get(cat)!,
      })
    }
  })

  // Add any remaining categories
  categoryMap.forEach((categoryAddons, category) => {
    if (!categoryOrder.includes(category)) {
      addonsByCategory.push({ category, addons: categoryAddons })
    }
  })

  return { addons, addonsByCategory }
}

export async function getVehicleType(
  vehicleTypeId: string,
  fromLocationId?: string,
  toLocationId?: string
): Promise<VehicleTypeDetails | null> {
  const supabase = createAdminClient()
  
  // Get vehicle type with pricing
  const { data: vehicleType, error } = await supabase
    .from('vehicle_types')
    .select(`
      id,
      name,
      slug,
      description,
      passenger_capacity,
      luggage_capacity,
      image_url,
      price_multiplier
    `)
    .eq('id', vehicleTypeId)
    .eq('is_active', true)
    .single()

  if (error || !vehicleType) {
    console.error('Error fetching vehicle type:', error)
    return null
  }

  let price = 50 // Default base price
  
  // If location IDs provided, get zone-based pricing
  if (fromLocationId && toLocationId) {
    // Get zones for both locations
    const { data: locations } = await supabase
      .from('locations')
      .select('id, zone_id')
      .in('id', [fromLocationId, toLocationId])
    
    if (locations && locations.length === 2) {
      const fromZoneId = locations.find(l => l.id === fromLocationId)?.zone_id
      const toZoneId = locations.find(l => l.id === toLocationId)?.zone_id
      
      if (fromZoneId && toZoneId) {
        // Get zone pricing
        const { data: zonePricing } = await supabase
          .from('zone_pricing')
          .select('base_price')
          .eq('from_zone_id', fromZoneId)
          .eq('to_zone_id', toZoneId)
          .eq('is_active', true)
          .single()
        
        if (zonePricing) {
          // Calculate price with vehicle type multiplier
          const multiplier = vehicleType.price_multiplier || 1.0
          price = zonePricing.base_price * multiplier
        }
      }
    }
  }

  return {
    ...vehicleType,
    price
  } as VehicleTypeDetails
}

// Selected addon schema for checkout
const selectedAddonSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
})

// Booking creation schema
const bookingSchema = z.object({
  vehicleTypeId: z.string().uuid(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
  pickupDate: z.string(),
  pickupTime: z.string(),
  passengerCount: z.number().min(1).max(50),
  luggageCount: z.number().min(0).max(50),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  specialRequests: z.string().optional(),
  childSeats: z.object({
    infant: z.number().min(0).max(4),
    booster: z.number().min(0).max(4)
  }),
  extraLuggageCount: z.number().min(0),
  basePrice: z.number().min(0),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  paymentMethod: z.enum(['card']),
  selectedAddons: z.array(selectedAddonSchema).optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>

export async function createBooking(formData: BookingFormData) {
  // Get authenticated user first using regular client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Authentication required to create booking')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only customers can create bookings
  if (!profile || profile.role !== 'customer') {
    const roleMessage = profile?.role ?
      `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} users` :
      'Users'
    throw new Error(`${roleMessage} cannot create bookings. Only customers can book vehicles.`)
  }

  // Use admin client for database operations to bypass RLS
  const adminClient = createAdminClient()
  
  // Validate the form data
  const validatedData = bookingSchema.parse(formData)
  
  // Generate booking number
  const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
  
  // Combine date and time for pickup datetime
  const pickupDateTime = new Date(`${validatedData.pickupDate}T${validatedData.pickupTime}`)
  
  // Calculate prices based on actual vehicle data
  const basePrice = validatedData.basePrice
  const extraLuggagePrice = validatedData.extraLuggageCount * 15 // $15 per extra bag
  const selectedAddonsPrice = validatedData.selectedAddons?.reduce(
    (sum, addon) => sum + addon.total_price,
    0
  ) || 0
  const amenitiesPrice = extraLuggagePrice + selectedAddonsPrice
  const totalPrice = basePrice + amenitiesPrice
  
  // Get zone IDs if location IDs are provided
  let fromZoneId = null
  let toZoneId = null
  
  if (validatedData.fromLocationId && validatedData.toLocationId) {
    const { data: locations } = await adminClient
      .from('locations')
      .select('id, zone_id')
      .in('id', [validatedData.fromLocationId, validatedData.toLocationId])
    
    if (locations) {
      fromZoneId = locations.find(l => l.id === validatedData.fromLocationId)?.zone_id
      toZoneId = locations.find(l => l.id === validatedData.toLocationId)?.zone_id
    }
  }
  
  // Start a transaction
  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      customer_id: user.id,
      vehicle_type_id: validatedData.vehicleTypeId,
      from_location_id: validatedData.fromLocationId || null,
      to_location_id: validatedData.toLocationId || null,
      from_zone_id: fromZoneId,
      to_zone_id: toZoneId,
      pickup_address: validatedData.pickupAddress,
      dropoff_address: validatedData.dropoffAddress,
      pickup_datetime: pickupDateTime.toISOString(),
      passenger_count: validatedData.passengerCount,
      luggage_count: validatedData.luggageCount,
      base_price: basePrice,
      amenities_price: amenitiesPrice,
      total_price: totalPrice,
      booking_status: 'pending',
      payment_status: 'processing',
      customer_notes: validatedData.specialRequests || null
    })
    .select()
    .single()
  
  if (bookingError || !booking) {
    console.error('Error creating booking:', bookingError)
    console.error('Booking data attempted:', {
      booking_number: bookingNumber,
      customer_id: user.id,
      vehicle_type_id: validatedData.vehicleTypeId,
      from_location_id: validatedData.fromLocationId,
      to_location_id: validatedData.toLocationId,
      pickup_address: validatedData.pickupAddress,
      dropoff_address: validatedData.dropoffAddress,
      pickup_datetime: pickupDateTime.toISOString(),
      passenger_count: validatedData.passengerCount,
      luggage_count: validatedData.luggageCount,
      base_price: basePrice,
      amenities_price: amenitiesPrice,
      total_price: totalPrice,
      booking_status: 'pending',
      payment_status: 'processing',
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
  const amenities: Array<{
    booking_id: string
    amenity_type: string
    quantity: number
    price: number
    addon_id?: string
  }> = []

  // Add extra luggage if any
  if (validatedData.extraLuggageCount > 0) {
    amenities.push({
      booking_id: booking.id,
      amenity_type: 'extra_luggage',
      quantity: validatedData.extraLuggageCount,
      price: validatedData.extraLuggageCount * 15
    })
  }

  // Add selected addons with addon_id reference
  if (validatedData.selectedAddons && validatedData.selectedAddons.length > 0) {
    for (const addon of validatedData.selectedAddons) {
      amenities.push({
        booking_id: booking.id,
        amenity_type: 'addon', // Generic type for database addons
        quantity: addon.quantity,
        price: addon.total_price,
        addon_id: addon.addon_id
      })
    }
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

  // Revalidate admin and customer paths to show new booking immediately
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/bookings')
  revalidatePath('/customer/dashboard')
  revalidatePath('/customer/bookings')

  return {
    success: true,
    bookingNumber: booking.booking_number,
    bookingId: booking.id,
    totalPrice: totalPrice
  }
}