'use server'

import { createClient } from '@/lib/supabase/server'
import { Location } from '@/lib/types/location'

export interface RouteWithDetails {
  id: string
  route_name: string
  route_slug: string
  distance_km: number
  estimated_duration_minutes: number
  base_price: number
  destination: {
    id: string
    name: string
    slug: string
    type: string
    city: string
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
      base_price,
      destination:destination_location_id(
        id,
        name,
        slug,
        type,
        city
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

  // Get vendor route services to calculate min prices
  const routeIds = routes.map(r => r.id)
  
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('vendor_route_services')
    .select(`
      route_id,
      vendor_id
    `)
    .in('route_id', routeIds)
    .eq('is_active', true)

  if (vendorError) {
    console.error('Error fetching vendor routes:', vendorError)
  }

  // Get vehicle counts for vendors
  const vendorIds = vendorRoutes?.map(vr => vr.vendor_id) || []
  
  const { data: vehicleCounts, error: vehicleError } = await supabase
    .from('vehicles')
    .select('business_id')
    .in('business_id', vendorIds)
    .eq('is_available', true)

  if (vehicleError) {
    console.error('Error fetching vehicles:', vehicleError)
  }

  // Map routes with calculated min prices and vehicle counts
  return routes.map(route => {
    const routeVendors = vendorRoutes?.filter(vr => vr.route_id === route.id) || []
    // Use base price for now, pricing will be determined by vehicle type
    const minPrice = route.base_price
    
    // Count available vehicles for this route
    const routeVendorIds = routeVendors.map(rv => rv.vendor_id)
    const availableVehicles = vehicleCounts?.filter(vc => 
      routeVendorIds.includes(vc.business_id)
    ).length || 0

    return {
      ...route,
      min_price: minPrice,
      available_vehicles: availableVehicles
    }
  })
}