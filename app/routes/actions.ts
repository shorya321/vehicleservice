'use server'

import { createClient } from '@/lib/supabase/server'
import type { PopularRoute } from '@/components/search/popular-routes'

const PAGE_SIZE = 12

export interface PublicRouteItem extends PopularRoute {
  isPopular: boolean
}

export interface PublicPaginatedRoutes {
  routes: PublicRouteItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getPublicRoutes(
  params: { page?: number; limit?: number } = {}
): Promise<PublicPaginatedRoutes> {
  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(id, name, slug, city),
      destination_location:locations!destination_location_id(id, name, slug, city)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
    .order('route_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching public routes:', error)
    return { routes: [], total: 0, page, limit, totalPages: 0 }
  }

  const routes: PublicRouteItem[] = (data || []).map(route => {
    const origin = route.origin_location as unknown as { id: string; name: string; slug: string; city: string } | null
    const dest = route.destination_location as unknown as { id: string; name: string; slug: string; city: string } | null

    return {
      id: route.id,
      slug: route.route_slug,
      originLocationId: route.origin_location_id,
      destinationLocationId: route.destination_location_id,
      originName: origin?.name || 'Unknown',
      destinationName: dest?.name || 'Unknown',
      originCity: origin?.city || '',
      destinationCity: dest?.city || '',
      originSlug: origin?.slug || undefined,
      destinationSlug: dest?.slug || undefined,
      startingPrice: 0,
      searchCount: 0,
      distance: route.distance_km || 0,
      duration: route.estimated_duration_minutes || 0,
      isPopular: route.is_popular === true,
    }
  })

  const total = count || 0

  return {
    routes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
