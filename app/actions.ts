'use server'

import { createClient } from '@/lib/supabase/server'
import { PopularRoute } from '@/components/search/popular-routes'
import { fetchPopularRoutes, fetchVehicleClasses } from '@/lib/home/catalog'

export interface PopularZone {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  locationCount: number
}

export async function getPopularRoutes(): Promise<PopularRoute[]> {
  return fetchPopularRoutes(await createClient())
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
  return fetchVehicleClasses(await createClient())
}
