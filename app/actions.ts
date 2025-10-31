'use server'

import { createClient } from '@/lib/supabase/server'
import { PopularRoute } from '@/components/search/popular-routes'

export interface PopularZone {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  locationCount: number
}

export async function getPopularRoutes(): Promise<PopularRoute[]> {
  const supabase = await createClient()

  // Use RPC function to get popular routes with all data
  // This bypasses RLS issues with nested joins
  const { data: routes, error } = await supabase
    .rpc('get_popular_routes')

  if (error) {
    console.error('Error fetching popular routes:', error)
    return []
  }

  // Map the RPC results to our PopularRoute format
  const result = routes?.map(route => ({
    id: route.id,
    slug: route.route_slug,
    originLocationId: route.origin_location_id,
    destinationLocationId: route.destination_location_id,
    originName: route.origin_name,
    destinationName: route.destination_name,
    originCity: route.origin_city,
    destinationCity: route.destination_city,
    startingPrice: 0, // Pricing is per vehicle type, not at route level
    searchCount: 0, // No longer tracking search counts
    distance: route.distance_km,
    duration: route.estimated_duration_minutes
  })) || []

  return result
}

export async function getPopularZones(): Promise<PopularZone[]> {
  const supabase = await createClient()

  const { data: zones, error } = await supabase
    .from('zones')
    .select(`
      *,
      locations(count)
    `)
    .eq('is_active', true)
    .order('sort_order')
    .order('name')
    .limit(6)

  if (error) {
    console.error('Error fetching popular zones:', error)
    return []
  }

  return zones.map(zone => ({
    id: zone.id,
    name: zone.name,
    slug: zone.slug,
    description: zone.description,
    sortOrder: zone.sort_order,
    locationCount: zone.locations?.[0]?.count || 0
  }))
}

export interface VehicleTypeForHome {
  id: string
  name: string
  slug: string
  passengerCapacity: number
  luggageCapacity: number
  description: string | null
  imageUrl: string | null
  sortOrder: number
}

export interface VehicleClassCategory {
  categoryId: string
  categoryName: string
  categorySlug: string
  sortOrder: number
  vehicleTypes: VehicleTypeForHome[]
}

export async function getVehicleClassesForHome(): Promise<VehicleClassCategory[]> {
  const supabase = await createClient()

  // Get active categories with their vehicle types
  const { data: categories, error } = await supabase
    .from('vehicle_categories')
    .select(`
      id,
      name,
      slug,
      sort_order,
      vehicle_types!inner(
        id,
        name,
        slug,
        passenger_capacity,
        luggage_capacity,
        description,
        image_url,
        sort_order,
        is_active
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching vehicle classes for home:', error)
    return []
  }

  if (!categories) {
    return []
  }

  // Transform and group data by category
  const categoryMap = new Map<string, VehicleClassCategory>()

  for (const category of categories) {
    const vehicleTypes = Array.isArray(category.vehicle_types)
      ? category.vehicle_types
      : [category.vehicle_types]

    // Filter active vehicle types
    const activeVehicleTypes = vehicleTypes
      .filter((vt: any) => vt.is_active === true)
      .map((vt: any) => ({
        id: vt.id,
        name: vt.name,
        slug: vt.slug,
        passengerCapacity: vt.passenger_capacity,
        luggageCapacity: vt.luggage_capacity,
        description: vt.description,
        imageUrl: vt.image_url,
        sortOrder: vt.sort_order || 999
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    // Only include categories that have active vehicle types
    if (activeVehicleTypes.length > 0) {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          sortOrder: category.sort_order || 999,
          vehicleTypes: activeVehicleTypes
        })
      }
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.sortOrder - b.sortOrder)
}