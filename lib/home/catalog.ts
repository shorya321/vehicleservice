import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createSearchClient } from '@/lib/supabase/search-client'
import type { PopularRoute } from '@/components/search/popular-routes'
import type { VehicleClassCategory } from '@/app/actions'

type Client = SupabaseClient<Database>

/** Home catalog data changes when an admin edits routes or vehicle types. */
const CATALOG_REVALIDATE_SECONDS = 300
const HOME_CATALOG_TAG = 'home-catalog'

export async function fetchPopularRoutes(supabase: Client): Promise<PopularRoute[]> {
  // Use RPC function to get popular routes with all data
  // This bypasses RLS issues with nested joins
  const { data: routes, error } = await supabase
    .rpc('get_popular_routes')

  if (error) {
    console.warn('Popular routes unavailable:', error.message || error.code || 'Unknown error')
    return []
  }

  if (!routes || routes.length === 0) return []

  // Get slugs for all origin/destination locations
  const locationIds = Array.from(
    new Set(routes.flatMap(r => [r.origin_location_id, r.destination_location_id]))
  )
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, slug')
    .in('id', locationIds)

  if (locationsError) {
    // Cards still work without slugs: they fall back to the ?from= search URL.
    console.warn('Popular route slugs unavailable:', locationsError.message)
  }

  const slugMap = new Map(locations?.map(l => [l.id, l.slug]) || [])

  // Map the RPC results to our PopularRoute format
  return routes.map(route => ({
    id: route.id,
    slug: route.route_slug,
    originLocationId: route.origin_location_id,
    destinationLocationId: route.destination_location_id,
    originName: route.origin_name,
    destinationName: route.destination_name,
    originCity: route.origin_city,
    destinationCity: route.destination_city,
    originSlug: slugMap.get(route.origin_location_id) || undefined,
    destinationSlug: slugMap.get(route.destination_location_id) || undefined,
    startingPrice: 0, // Pricing is per vehicle type, not at route level
    searchCount: 0, // No longer tracking search counts
    distance: route.distance_km,
    duration: route.estimated_duration_minutes,
    image: route.image_url,
    imageAlt: route.image_alt
  }))
}

interface VehicleTypeRow {
  id: string
  name: string
  slug: string
  passenger_capacity: number
  luggage_capacity: number | null
  description: string | null
  image_url: string | null
  sort_order: number | null
  is_active: boolean | null
}

export async function fetchVehicleClasses(supabase: Client): Promise<VehicleClassCategory[]> {
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

  const result: VehicleClassCategory[] = []

  for (const category of categories) {
    const vehicleTypes: VehicleTypeRow[] = Array.isArray(category.vehicle_types)
      ? category.vehicle_types
      : [category.vehicle_types]

    // `??`, not `||`: a sort_order of 0 is a real position, not a missing one.
    const activeVehicleTypes = vehicleTypes
      .filter(vt => vt.is_active === true)
      .map(vt => ({
        id: vt.id,
        name: vt.name,
        slug: vt.slug,
        passengerCapacity: vt.passenger_capacity,
        luggageCapacity: vt.luggage_capacity ?? 0,
        description: vt.description,
        imageUrl: vt.image_url,
        sortOrder: vt.sort_order ?? 999
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)

    // Only include categories that have active vehicle types
    if (activeVehicleTypes.length > 0 && !result.some(c => c.categoryId === category.id)) {
      result.push({
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: category.slug,
        sortOrder: category.sort_order ?? 999,
        vehicleTypes: activeVehicleTypes
      })
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder)
}

/*
 * Cached for the home page. The page is dynamic (auth cookies), so without
 * this every visit re-ran three catalog queries. The cache runs with the
 * cookieless anon client: these tables return the same rows to every visitor
 * (checked against the service role on 2026-09-15), and cookies() cannot be
 * read inside unstable_cache anyway. Reviews stay uncached on purpose: their
 * reviewer names come through a profiles join whose visibility may depend on
 * the session.
 */
export const getCachedPopularRoutes = unstable_cache(
  async (): Promise<PopularRoute[]> => fetchPopularRoutes(createSearchClient()),
  ['home-popular-routes'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [HOME_CATALOG_TAG] }
)

export const getCachedVehicleClasses = unstable_cache(
  async (): Promise<VehicleClassCategory[]> => fetchVehicleClasses(createSearchClient()),
  ['home-vehicle-classes'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [HOME_CATALOG_TAG] }
)
