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
  category: {
    id: string
    name: string
    slug: string
    image_url: string | null
  } | null
  price: number
  available_count: number
  vehicle_examples: string[]
}

export async function getRouteBySlug(routeSlug: string): Promise<RouteDetails | null> {
  const supabase = await createClient()
  
  // Parse the route slug to get origin and destination
  const parsed = parseRouteSlug(routeSlug)
  if (!parsed) {
    console.error('Invalid route slug:', routeSlug)
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

  if (error || !data) {
    console.error('Error fetching route:', error)
    return null
  }

  return data as RouteDetails
}

export async function getRoutesVehicles(routeId: string): Promise<VehicleTypeWithPricing[]> {
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
        category:category_id(
          id,
          name,
          slug,
          image_url
        )
      )
    `)
    .eq('route_id', routeId)
    .eq('is_active', true)
    .order('price')

  if (pricingError || !routePricing) {
    console.error('Error fetching route pricing:', pricingError)
    return []
  }

  // Get vendors serving this route
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('vendor_route_services')
    .select('vendor_id')
    .eq('route_id', routeId)
    .eq('is_active', true)

  if (vendorError || !vendorRoutes || vendorRoutes.length === 0) {
    console.error('Error fetching vendor routes:', vendorError)
    return []
  }

  const vendorIds = vendorRoutes.map(vr => vr.vendor_id)

  // Process each vehicle type to get availability and example vehicles
  const vehicleTypesWithAvailability = await Promise.all(
    routePricing.map(async (pricing) => {
      if (!pricing.vehicle_type) return null

      // Get available vehicles of this type from active vendors
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, make, model')
        .eq('vehicle_type_id', pricing.vehicle_type.id)
        .in('business_id', vendorIds)
        .eq('is_available', true)
        .limit(5) // Get a few examples

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError)
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