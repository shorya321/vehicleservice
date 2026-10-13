'use server'

import { createClient } from '@/lib/supabase/server'
import { Location } from '@/lib/types/location'

export interface RouteWithDetails {
  id: string
  route_name: string
  route_slug: string
  distance_km: number
  estimated_duration_minutes: number
  destination: {
    id: string
    name: string
    slug: string
    city: string | null
    location_type_label?: string
  }
  min_price: number
  available_vehicles: number
}

export async function getLocationBySlug(countrySlug: string, citySlug: string): Promise<Location | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('country_slug', countrySlug)
    .eq('slug', citySlug)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    if (error) {
      console.error('Error fetching location:', error)
    }
    return null
  }

  return data as Location
}

export async function getRoutesFromLocation(locationId: string): Promise<RouteWithDetails[]> {
  const supabase = await createClient()

  // Get all routes from this location
  const { data: routes, error } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      route_slug,
      distance_km,
      estimated_duration_minutes,
      destination:locations!routes_destination_location_id_fkey(
        id,
        name,
        slug,
        city,
        location_types(label)
      )
    `)
    .eq('origin_location_id', locationId)
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
    .order('route_name')

  if (error || !routes) {
    console.error('Error fetching routes:', error)
    return []
  }

  // Get all available vehicles (aggregator model)
  const { data: vehicleCounts, error: vehicleError } = await supabase
    .from('vehicles')
    .select('business_id')
    .eq('is_available', true)

  if (vehicleError) {
    console.error('Error fetching vehicles:', vehicleError)
  }

  // Map routes with calculated min prices and vehicle counts
  return routes.map(route => {
    // Zone pricing will be used for actual price calculation
    const minPrice = 0
    
    // Count all available vehicles (aggregator model - all vehicles available for all routes)
    const availableVehicles = vehicleCounts?.length || 0

    const { location_types, ...destination } = route.destination
    return {
      ...route,
      distance_km: route.distance_km ?? 0,
      estimated_duration_minutes: route.estimated_duration_minutes ?? 0,
      destination: {
        ...destination,
        location_type_label: location_types?.label,
      },
      min_price: minPrice,
      available_vehicles: availableVehicles
    }
  })
}