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

  // Get popular routes based on search count
  const { data: routes, error } = await supabase
    .from('routes')
    .select(`
      id,
      route_slug,
      route_name,
      base_price,
      distance_km,
      estimated_duration_minutes,
      origin_location:locations!routes_origin_location_id_fkey(name, city),
      destination_location:locations!routes_destination_location_id_fkey(name, city)
    `)
    .eq('is_active', true)
    .eq('is_popular', true)
    .limit(6)

  if (error) {
    console.error('Error fetching popular routes:', error)
    return []
  }

  // Get search counts for these routes
  const routeIds = routes.map(r => r.id)
  const { data: searchCounts } = await supabase
    .from('route_searches')
    .select('route_id')
    .in('route_id', routeIds)
    .gte('search_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

  const searchCountMap = searchCounts?.reduce((acc, search) => {
    acc[search.route_id] = (acc[search.route_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return routes.map(route => ({
    id: route.id,
    slug: route.route_slug,
    originName: route.origin_location.name,
    destinationName: route.destination_location.name,
    originCity: route.origin_location.city,
    destinationCity: route.destination_location.city,
    startingPrice: route.base_price,
    searchCount: searchCountMap[route.id] || 0,
    distance: route.distance_km,
    duration: route.estimated_duration_minutes
  }))
}

export async function trackRouteSearch(params: {
  routeId?: string
  originLocationId: string
  destinationLocationId: string
  passengerCount: number
  userId?: string
}) {
  const supabase = await createClient()

  // Try to insert with passenger_count first
  let { error } = await supabase
    .from('route_searches')
    .insert({
      route_id: params.routeId,
      origin_location_id: params.originLocationId,
      destination_location_id: params.destinationLocationId,
      passenger_count: params.passengerCount,
      user_id: params.userId
    })

  // If passenger_count column doesn't exist, try without it
  if (error && error.message.includes('passenger_count')) {
    console.log('passenger_count column not found, inserting without it...')
    
    const { error: fallbackError } = await supabase
      .from('route_searches')
      .insert({
        route_id: params.routeId,
        origin_location_id: params.originLocationId,
        destination_location_id: params.destinationLocationId,
        user_id: params.userId
      })

    if (fallbackError) {
      console.error('Error tracking route search (fallback):', fallbackError)
    }
  } else if (error) {
    console.error('Error tracking route search:', error)
  }
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