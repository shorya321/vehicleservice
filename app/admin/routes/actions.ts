'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  Route, 
  RouteInsert, 
  RouteUpdate, 
  RouteWithDetails,
  RouteFilters,
  PaginatedRoutes 
} from '@/lib/types/route'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/supabase/types'

const PAGE_SIZE = 10

export async function getRoutes(filters: RouteFilters = {}): Promise<PaginatedRoutes> {
  const supabase = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  let query = supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `, { count: 'exact' })

  // Apply filters
  if (filters.search) {
    query = query.or(`route_name.ilike.%${filters.search}%,route_slug.ilike.%${filters.search}%`)
  }

  if (filters.originLocationId) {
    query = query.eq('origin_location_id', filters.originLocationId)
  }

  if (filters.destinationLocationId) {
    query = query.eq('destination_location_id', filters.destinationLocationId)
  }

  if (filters.isActive !== 'all' && filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.isPopular !== 'all' && filters.isPopular !== undefined) {
    query = query.eq('is_popular', filters.isPopular)
  }

  // Apply pagination
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching routes:', error)
    throw new Error('Failed to fetch routes')
  }

  // Fetch search counts for each route
  const routeIds = data?.map(route => route.id) || []
  const searchCounts = await getSearchCounts(routeIds)

  const routesWithDetails: RouteWithDetails[] = (data || []).map(route => ({
    ...route,
    search_count: searchCounts[route.id] || 0,
    vendor_count: 0 // All vendors can service all routes (aggregator model)
  }))

  return {
    routes: routesWithDetails,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

async function getSearchCounts(routeIds: string[]): Promise<Record<string, number>> {
  if (routeIds.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('route_searches')
    .select('route_id')
    .in('route_id', routeIds)

  if (error) {
    console.error('Error fetching search counts:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(search => {
    if (search.route_id) {
      counts[search.route_id] = (counts[search.route_id] || 0) + 1
    }
  })

  return counts
}

export async function getRoute(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching route:', error)
    throw new Error('Failed to fetch route')
  }

  return data
}

export async function createRoute(data: Omit<RouteInsert, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  // Validate that origin and destination are different
  if (data.origin_location_id === data.destination_location_id) {
    throw new Error('Origin and destination must be different')
  }

  // Generate slug if not provided
  if (!data.route_slug) {
    data.route_slug = generateSlug(data.route_name)
  }

  const { data: route, error } = await supabase
    .from('routes')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating route:', error)
    if (error.code === '23505') {
      if (error.message.includes('route_slug')) {
        throw new Error('A route with this slug already exists')
      }
      if (error.message.includes('unique_route_combination')) {
        throw new Error('A route between these locations already exists')
      }
    }
    throw new Error('Failed to create route')
  }

  revalidatePath('/admin/routes')
  return route
}

export async function updateRoute(id: string, data: Omit<RouteUpdate, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  // Validate that origin and destination are different if both are provided
  if (data.origin_location_id && data.destination_location_id && 
      data.origin_location_id === data.destination_location_id) {
    throw new Error('Origin and destination must be different')
  }

  const { data: route, error } = await supabase
    .from('routes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating route:', error)
    if (error.code === '23505') {
      if (error.message.includes('route_slug')) {
        throw new Error('A route with this slug already exists')
      }
      if (error.message.includes('unique_route_combination')) {
        throw new Error('A route between these locations already exists')
      }
    }
    throw new Error('Failed to update route')
  }

  revalidatePath('/admin/routes')
  revalidatePath(`/admin/routes/${id}/edit`)
  return route
}

export async function deleteRoute(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting route:', error)
    throw new Error('Failed to delete route')
  }

  revalidatePath('/admin/routes')
}

export async function toggleRouteStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routes')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling route status:', error)
    throw new Error('Failed to update route status')
  }

  revalidatePath('/admin/routes')
}

export async function toggleRoutePopular(id: string, isPopular: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routes')
    .update({ is_popular: isPopular })
    .eq('id', id)

  if (error) {
    console.error('Error toggling route popular status:', error)
    throw new Error('Failed to update route popular status')
  }

  revalidatePath('/admin/routes')
}

export async function getPopularRoutes(limit: number = 10) {
  const supabase = await createClient()

  // Use the database function we created
  const { data, error } = await supabase
    .rpc('get_popular_routes', { 
      limit_count: limit,
      days_back: 30 
    })

  if (error) {
    console.error('Error fetching popular routes:', error)
    throw new Error('Failed to fetch popular routes')
  }

  return data
}

export async function bulkDeleteRoutes(ids: string[]) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  const { error } = await supabase
    .from('routes')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting routes:', error)
    throw new Error('Failed to delete routes')
  }

  revalidatePath('/admin/routes')
  return { count: ids.length }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}