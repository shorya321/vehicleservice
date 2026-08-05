'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { signBookingPayload } from '@/lib/security/booking-hmac'
import { phoneSchema } from '@/lib/validation/phone'
import { bookingWallClockToUtc } from '@/lib/utils/timezone'

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
  category: string
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
  /**
   * Admin-configured (see the addons table). When true the picker asks for one child age per unit
   * and caps the combined quantity of all such addons at children + infants. Re-read from the DB in
   * createBooking. The client's copy is a rendering hint only.
   */
  requires_child_age: boolean
  /**
   * Typical age range for this seat. Both null = no fit check. Drives an advisory hint only. The
   * age dropdown still offers the full range, because a mismatch is the signal worth surfacing.
   */
  child_age_min: number | null
  child_age_max: number | null
}

export interface CheckoutAddonsByCategory {
  category: string
  addons: CheckoutAddon[]
}

export interface ExtraItemPrices {
  extraLuggagePerUnit: number
  childSeatPerUnit: number
}

const EXTRA_ITEM_DEFAULTS: ExtraItemPrices = {
  extraLuggagePerUnit: 15,
  childSeatPerUnit: 10,
}

export async function getExtraItemPrices(): Promise<ExtraItemPrices> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('addons')
    .select('name, price, category')
    .eq('is_active', true)
    .eq('pricing_type', 'per_unit')
    .in('category', ['Luggage', 'Child Safety'])

  if (!data || data.length === 0) return EXTRA_ITEM_DEFAULTS

  const luggageAddon = data.find(
    a => a.category === 'Luggage' && a.name.toLowerCase().includes('luggage')
  )
  const childSeatAddon = data.find(a => a.category === 'Child Safety')

  return {
    extraLuggagePerUnit: luggageAddon?.price ?? EXTRA_ITEM_DEFAULTS.extraLuggagePerUnit,
    childSeatPerUnit: childSeatAddon?.price ?? EXTRA_ITEM_DEFAULTS.childSeatPerUnit,
  }
}

/**
 * Get active addons for customer checkout
 */
export async function getActiveAddons(): Promise<{
  addons: CheckoutAddon[]
  addonsByCategory: CheckoutAddonsByCategory[]
}> {
  const supabase = await createClient()

  // Child seats used to be filtered out here on the theory that they were free and implied by the
  // Guests picker. They are now sold like any other add-on, so nothing is excluded by category.
  // Instead, `requires_child_age` (admin-configured per addon) drives the behaviour: the picker
  // hides those addons unless the booking declares children or infants, caps their combined
  // quantity at children + infants, and collects one age per seat. createBooking re-reads the flag
  // from the DB and re-applies the cap, so the client is never trusted for either.
  const { data, error } = await supabase
    .from('addons')
    .select('id, name, description, icon, price, pricing_type, max_quantity, category, requires_child_age, child_age_min, child_age_max')
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

  // Child seats lead: they are the only legally-required extra, and the picker hides the whole
  // group when the booking has no children or infants.
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
      price_multiplier,
      vehicle_categories(name)
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
    id: vehicleType.id,
    name: vehicleType.name,
    slug: vehicleType.slug,
    description: vehicleType.description,
    passenger_capacity: vehicleType.passenger_capacity,
    luggage_capacity: vehicleType.luggage_capacity ?? 0,
    image_url: vehicleType.image_url,
    price,
    category: vehicleType.vehicle_categories?.name || 'Premium',
  }
}

// Selected addon schema for checkout.
// `requires_child_age` is deliberately NOT declared: the client sends it as a rendering hint and
// zod's default object stripping drops it, so a forged `false` can never skip the age requirement.
// The flag is re-read from the addons table below.
const selectedAddonSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  /** One age per seat, in years, 0 = under 1. Length must equal `quantity`. Asserted server-side. */
  child_ages: z.array(z.number().int().min(0).max(12)).max(20).optional(),
})

// Booking creation schema
const bookingSchema = z.object({
  vehicleTypeId: z.string().uuid(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid pickup date'),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid pickup time'),
  /** Total guests (adults + children + infants). See the refine below. */
  passengerCount: z.number().min(1).max(50),
  adults: z.number().min(1).max(50).optional(),
  children: z.number().min(0).max(50).optional(),
  infants: z.number().min(0).max(50).optional(),
  luggageCount: z.number().min(0).max(50),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: phoneSchema,
  specialRequests: z.string().optional(),
  extraLuggageCount: z.number().min(0),
  basePrice: z.number().min(0),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  paymentMethod: z.enum(['card']),
  selectedAddons: z.array(selectedAddonSchema).optional(),
})
  // The breakdown must agree with the total. Without this a client could post
  // `passengerCount: 1, adults: 50`. The capacity guard below only inspects passengerCount, so the
  // contradiction would be persisted. (The business flow gets this invariant for free from its
  // single-writer RPC; this action is a direct insert, so it must assert it itself.)
  // Customer rule: every guest occupies a seat, infants included.
  .refine(
    (d) =>
      d.adults === undefined ||
      d.adults + (d.children ?? 0) + (d.infants ?? 0) === d.passengerCount,
    {
      message: 'passengerCount must equal adults + children + infants',
      path: ['passengerCount'],
    }
  )

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
  
  // Combine date and time for pickup datetime (interpreted as Dubai wall-clock)
  const pickupDateTime = bookingWallClockToUtc(validatedData.pickupDate, validatedData.pickupTime)
  
  // --- Server-side price verification ---

  // 3a. Recalculate base price from zone pricing (never trust client)
  const vehicleType = await getVehicleType(
    validatedData.vehicleTypeId,
    validatedData.fromLocationId,
    validatedData.toLocationId
  )
  if (!vehicleType) {
    throw new Error('Vehicle type not found or inactive')
  }

  // The search filters by capacity and the checkout page clamps, but both are client-reachable.
  // This is the authoritative gate. It runs before the booking row is inserted and well before a
  // Stripe PaymentIntent exists (created later, on the payment page), so it cannot strand a payment.
  if (validatedData.passengerCount > vehicleType.passenger_capacity) {
    throw new Error(
      `This vehicle seats ${vehicleType.passenger_capacity}; the booking is for ${validatedData.passengerCount} passengers.`
    )
  }

  const basePrice = vehicleType.price

  // 3b. Verify addon prices against database.
  // Everything the client sent about an addon is re-derived here: price, per-addon quantity cap,
  // whether it needs child ages, and how many such seats the guest breakdown permits. This runs
  // before the booking row is inserted and long before a Stripe PaymentIntent exists, so a
  // rejection can never strand a payment.
  let verifiedAddonsPrice = 0
  // addon_id -> DB row, reused by the booking_amenities insert further down so the prices written
  // there come from the same read that was verified (it used to re-query and could disagree).
  const addonMap = new Map<string, { id: string; name: string; price: number; max_quantity: number | null; requires_child_age: boolean }>()
  if (validatedData.selectedAddons && validatedData.selectedAddons.length > 0) {
    const addonIds = validatedData.selectedAddons.map(a => a.addon_id)
    const { data: dbAddons, error: addonError } = await adminClient
      .from('addons')
      .select('id, name, price, max_quantity, requires_child_age')
      .in('id', addonIds)
      // An addon deactivated while the customer sat on the checkout page must not be sellable.
      .eq('is_active', true)

    if (addonError || !dbAddons) {
      throw new Error('Failed to verify addon prices')
    }

    for (const a of dbAddons) addonMap.set(a.id, a)

    let ageSeatsRequested = 0

    for (const addon of validatedData.selectedAddons) {
      const db = addonMap.get(addon.addon_id)
      if (!db) {
        throw new Error(`Addon ${addon.addon_id} not found`)
      }
      if (Math.abs(addon.unit_price - db.price) > 0.01) {
        throw new Error(`Addon price mismatch for ${addon.addon_id}`)
      }
      const expectedTotal = db.price * addon.quantity
      if (Math.abs(addon.total_price - expectedTotal) > 0.01) {
        throw new Error(`Addon total mismatch for ${addon.addon_id}`)
      }
      if (db.max_quantity != null && addon.quantity > db.max_quantity) {
        throw new Error(`${db.name}: maximum ${db.max_quantity} per booking`)
      }

      if (db.requires_child_age) {
        // One age per seat. The DB CHECK enforces this too, but failing here keeps a bad payload
        // from ever reaching the insert. Where the error is swallowed as non-critical.
        const ages = addon.child_ages ?? []
        if (ages.length !== addon.quantity) {
          throw new Error(`${db.name}: one child age is required per seat`)
        }
        ageSeatsRequested += addon.quantity
      }

      verifiedAddonsPrice += expectedTotal
    }

    // Authoritative version of the picker's cap. `passengerCount === adults + children + infants`
    // is already asserted by the schema refine, so this cannot be widened by inflating the
    // breakdown. Doing so would fail that refine or the vehicle capacity guard above.
    const childSeatCapacity = (validatedData.children ?? 0) + (validatedData.infants ?? 0)
    if (ageSeatsRequested > childSeatCapacity) {
      throw new Error(
        `You selected ${ageSeatsRequested} child seat(s) but the booking has ${childSeatCapacity} child/infant guest(s).`
      )
    }
  }

  const extraPrices = await getExtraItemPrices()
  const extraLuggagePrice = validatedData.extraLuggageCount * extraPrices.extraLuggagePerUnit
  const amenitiesPrice = extraLuggagePrice + verifiedAddonsPrice
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
      // Bookings that predate the breakdown are all-adults; same shape as the migration's backfill.
      adults: validatedData.adults ?? validatedData.passengerCount,
      children: validatedData.children ?? 0,
      infants: validatedData.infants ?? 0,
      luggage_count: validatedData.luggageCount,
      base_price: basePrice,
      amenities_price: amenitiesPrice,
      total_price: totalPrice,
      currency: 'AED', // Charge currency is always AED (PaymentIntent hardcodes 'aed')
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
      adults: validatedData.adults ?? validatedData.passengerCount,
      children: validatedData.children ?? 0,
      infants: validatedData.infants ?? 0,
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

  // Sign booking with HMAC for payment integrity
  try {
    const { signature, timestamp, nonce } = signBookingPayload({
      bookingId: booking.id,
      totalPrice,
      customerId: user.id,
      vehicleTypeId: validatedData.vehicleTypeId,
    })

    const { error: sigError } = await adminClient
      .from('bookings')
      .update({
        price_signature: signature,
        price_signature_timestamp: timestamp,
        price_signature_nonce: nonce,
      })
      .eq('id', booking.id)

    if (sigError) {
      // Signature storage failed. Delete the booking to prevent unsigned payments
      await adminClient.from('bookings').delete().eq('id', booking.id)
      throw new Error('Failed to secure booking signature')
    }
  } catch (sigCatchError) {
    // If signing itself fails, clean up
    await adminClient.from('bookings').delete().eq('id', booking.id)
    throw sigCatchError
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
    child_ages?: number[] | null
  }> = []

  // Add extra luggage if any
  if (validatedData.extraLuggageCount > 0) {
    amenities.push({
      booking_id: booking.id,
      amenity_type: 'extra_luggage',
      quantity: validatedData.extraLuggageCount,
      price: extraLuggagePrice,
    })
  }

  // Add selected addons with addon_id reference. Prices come from `addonMap`, populated by the
  // verification step above. The same read that was checked, rather than a second query that
  // could return something different.
  if (validatedData.selectedAddons && validatedData.selectedAddons.length > 0) {
    for (const addon of validatedData.selectedAddons) {
      const db = addonMap.get(addon.addon_id)
      const dbPrice = db?.price ?? addon.unit_price
      amenities.push({
        booking_id: booking.id,
        amenity_type: 'addon',
        quantity: addon.quantity,
        price: dbPrice * addon.quantity,
        addon_id: addon.addon_id,
        // NULL for every non-child addon and every pre-existing row, so display code that does not
        // select this column is unaffected. Keyed off the DB flag, never the client's copy.
        child_ages: db?.requires_child_age ? (addon.child_ages ?? null) : null,
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

  // Revalidate admin and account paths to show new booking immediately
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/bookings')
  revalidatePath('/account')

  return {
    success: true,
    bookingNumber: booking.booking_number,
    tripNumber: booking.trip_number,
    bookingId: booking.id,
    totalPrice: totalPrice
  }
}