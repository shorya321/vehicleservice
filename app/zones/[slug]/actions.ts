'use server'

import { createClient } from '@/lib/supabase/server'

export interface ZoneDetails {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export interface ZoneLocation {
  id: string
  name: string
  type: string
  address: string | null
  city: string
  country: string
  latitude: number | null
  longitude: number | null
}

export interface DestinationZone {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  currency: string
}

export interface PopularRoute {
  id: string
  routeName: string
  destinationName: string
  destinationCity: string
  distance: number
  duration: number
}

export async function getZoneBySlug(slug: string): Promise<ZoneDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching zone:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    sortOrder: data.sort_order,
    isActive: data.is_active
  }
}

export async function getZoneLocations(zoneId: string): Promise<ZoneLocation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching zone locations:', error)
    return []
  }

  return data.map(location => ({
    id: location.id,
    name: location.name,
    type: location.type,
    address: location.address,
    city: location.city,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude
  }))
}

export async function getDestinationZones(fromZoneId: string): Promise<DestinationZone[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zone_pricing')
    .select(`
      *,
      to_zone:zones!zone_pricing_to_zone_id_fkey(
        id,
        name,
        slug,
        description
      )
    `)
    .eq('from_zone_id', fromZoneId)
    .neq('to_zone_id', fromZoneId)  // Exclude self-transfers
    .eq('is_active', true)
    .order('base_price')

  if (error) {
    console.error('Error fetching destination zones:', error)
    return []
  }

  return data.map(pricing => ({
    id: pricing.to_zone.id,
    name: pricing.to_zone.name,
    slug: pricing.to_zone.slug,
    description: pricing.to_zone.description,
    basePrice: pricing.base_price,
    currency: pricing.currency
  }))
}

export async function getPopularRoutesFromZone(zoneId: string): Promise<PopularRoute[]> {
  const supabase = await createClient()

  // First get locations in this zone
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('zone_id', zoneId)

  if (!locations || locations.length === 0) {
    return []
  }

  const locationIds = locations.map(l => l.id)

  // Get routes from these locations
  const { data: routes, error } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      distance_km,
      estimated_duration_minutes,
      destination_location:locations!routes_destination_location_id_fkey(
        name,
        city
      )
    `)
    .in('origin_location_id', locationIds)
    .eq('is_active', true)
    .eq('is_popular', true)
    .limit(6)

  if (error) {
    console.error('Error fetching popular routes:', error)
    return []
  }

  return routes.map(route => ({
    id: route.id,
    routeName: route.route_name,
    destinationName: route.destination_location.name,
    destinationCity: route.destination_location.city,
    distance: route.distance_km,
    duration: route.estimated_duration_minutes
  }))
}