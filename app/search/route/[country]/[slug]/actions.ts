'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseRouteSlug } from '@/lib/utils/slug'

export interface RouteDetails {
  id: string
  route_name: string
  route_slug: string
  distance_km: number
  estimated_duration_minutes: number
  base_price: number
  origin: {
    id: string
    name: string
    slug: string
    city: string
    country_code: string
  }
  destination: {
    id: string
    name: string
    slug: string
    city: string
    type: string
  }
}

export interface VehicleTypeWithPricing {
  id: string
  name: string
  slug: string
  description: string | null
  passenger_capacity: number
  luggage_capacity: number
  image_url: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  price: number
  available_count: number
  vehicle_examples: string[]
}

export async function getRouteBySlug(routeSlug: string): Promise<RouteDetails | null> {
  const supabase = await createClient()
  
  console.log(`Fetching route with slug: ${routeSlug}`)
  
  // Parse the route slug to get origin and destination
  const parsed = parseRouteSlug(routeSlug)
  if (!parsed) {
    console.error('Invalid route slug format:', routeSlug)
    return null
  }

  const { data, error } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      route_slug,
      distance_km,
      estimated_duration_minutes,
      base_price,
      origin:origin_location_id(
        id,
        name,
        slug,
        city,
        country_code
      ),
      destination:destination_location_id(
        id,
        name,
        slug,
        city,
        type
      )
    `)
    .eq('route_slug', routeSlug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`Route not found: ${routeSlug}. This route may need to be created.`)
    } else {
      console.error('Error fetching route:', error)
    }
    return null
  }

  if (!data) {
    console.log(`No route found with slug: ${routeSlug}`)
    return null
  }

  console.log(`Found route: ${data.route_name} (ID: ${data.id})`)
  return data as RouteDetails
}

export async function getRoutesVehicles(routeId: string): Promise<VehicleTypeWithPricing[]> {
  console.log(`Fetching vehicle types for route: ${routeId}`)
  
  // Use admin client to bypass RLS for public route data
  const supabase = createAdminClient()

  // Get route vehicle type pricing for this route
  const { data: routePricing, error: pricingError } = await supabase
    .from('route_vehicle_type_pricing')
    .select(`
      id,
      price,
      vehicle_type:vehicle_type_id(
        id,
        name,
        slug,
        description,
        passenger_capacity,
        luggage_capacity,
        sort_order,
        image_url,
        category:category_id(
          id,
          name,
          slug
        )
      )
    `)
    .eq('route_id', routeId)
    .eq('is_active', true)
    .order('price')

  if (pricingError) {
    console.error('Error fetching route pricing:', pricingError)
    return []
  }

  if (!routePricing || routePricing.length === 0) {
    console.warn(`No pricing configured for route ${routeId}. Vehicle types need to be configured.`)
    
    // Fetch all active vehicle types to show as "Request Quote"
    const { data: vehicleTypes, error: vtError } = await supabase
      .from('vehicle_types')
      .select(`
        id,
        name,
        slug,
        description,
        passenger_capacity,
        luggage_capacity,
        sort_order,
        image_url,
        category:category_id(
          id,
          name,
          slug
        )
      `)
      .eq('is_active', true)
      .order('sort_order')

    if (vtError || !vehicleTypes) {
      console.error('Error fetching vehicle types:', vtError)
      return []
    }

    // Return vehicle types without pricing (for "Request Quote" display)
    return vehicleTypes.map(vt => ({
      id: vt.id,
      name: vt.name,
      slug: vt.slug,
      description: vt.description,
      passenger_capacity: vt.passenger_capacity,
      luggage_capacity: vt.luggage_capacity || 2,
      image_url: vt.image_url,
      category: vt.category,
      price: 0, // No price configured
      available_count: 0,
      vehicle_examples: []
    }))
  }

  console.log(`Found ${routePricing.length} vehicle types with pricing for route ${routeId}`)

  // Get vendors serving this route
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('vendor_route_services')
    .select('vendor_id')
    .eq('route_id', routeId)
    .eq('is_active', true)

  if (vendorError) {
    console.error('Error fetching vendor routes:', vendorError)
    // Continue without vendor-specific data rather than returning empty
  }

  // If no vendors are assigned, log a warning but continue
  if (!vendorRoutes || vendorRoutes.length === 0) {
    console.warn(`No vendors currently serving route ${routeId}. Showing vehicle types without availability.`)
  }

  const vendorIds = vendorRoutes?.map(vr => vr.vendor_id) || []

  // Process each vehicle type to get availability and example vehicles
  const vehicleTypesWithAvailability = await Promise.all(
    routePricing.map(async (pricing) => {
      if (!pricing.vehicle_type) return null

      // Get available vehicles of this type from active vendors (if any vendors exist)
      let vehicles = null
      let vehiclesError = null
      
      if (vendorIds.length > 0) {
        const result = await supabase
          .from('vehicles')
          .select('id, make, model')
          .eq('vehicle_type_id', pricing.vehicle_type.id)
          .in('business_id', vendorIds)
          .eq('is_available', true)
          .limit(5) // Get a few examples
        
        vehicles = result.data
        vehiclesError = result.error
        
        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError)
        }
      }

      const availableCount = vehicles?.length || 0
      const vehicleExamples = vehicles
        ? [...new Set(vehicles.map(v => `${v.make} ${v.model}`))]
        : []

      return {
        id: pricing.vehicle_type.id,
        name: pricing.vehicle_type.name,
        slug: pricing.vehicle_type.slug,
        description: pricing.vehicle_type.description,
        passenger_capacity: pricing.vehicle_type.passenger_capacity,
        luggage_capacity: pricing.vehicle_type.luggage_capacity || 2,
        image_url: pricing.vehicle_type.image_url,
        category: pricing.vehicle_type.category,
        price: pricing.price,
        available_count: availableCount,
        vehicle_examples: vehicleExamples.slice(0, 3) // Show up to 3 examples
      }
    })
  )

  // Filter out nulls and sort by sort_order, then by price
  // Show all vehicle types with pricing, even if no vehicles are currently available
  return vehicleTypesWithAvailability
    .filter((vt): vt is VehicleTypeWithPricing => vt !== null)
    .sort((a, b) => {
      // First sort by category sort order if available
      const aOrder = routePricing.find(p => p.vehicle_type?.id === a.id)?.vehicle_type?.sort_order || 999
      const bOrder = routePricing.find(p => p.vehicle_type?.id === b.id)?.vehicle_type?.sort_order || 999
      if (aOrder !== bOrder) return aOrder - bOrder
      // Then by price
      return a.price - b.price
    })
}