'use server'

import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/user-actions'
import { revalidatePath } from 'next/cache'
import { 
  RouteWithLocations, 
  VendorRouteService, 
  VendorRouteServiceWithRoute,
  RouteFilters
} from '@/lib/types/route'

export async function getVendorRoutes(filters?: RouteFilters) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Build query
  let query = supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `, { count: 'exact' })
    .eq('created_by', vendorApplication.id)
    .eq('created_by_type', 'vendor')

  // Apply filters
  if (filters?.search) {
    query = query.or(`route_name.ilike.%${filters.search}%,route_slug.ilike.%${filters.search}%`)
  }

  if (filters?.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters?.isPopular !== undefined && filters.isPopular !== 'all') {
    query = query.eq('is_popular', filters.isPopular)
  }

  if (filters?.isShared !== undefined && filters.isShared !== 'all') {
    query = query.eq('is_shared', filters.isShared)
  }

  if (filters?.originLocationId && filters.originLocationId !== 'all') {
    query = query.eq('origin_location_id', filters.originLocationId)
  }

  if (filters?.destinationLocationId && filters.destinationLocationId !== 'all') {
    query = query.eq('destination_location_id', filters.destinationLocationId)
  }

  // Apply pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)
  query = query.order('created_at', { ascending: false })

  const { data: routes, error, count } = await query

  if (error) {
    console.error('Error fetching vendor routes:', error)
    return []
  }

  return routes as RouteWithLocations[]
}

export async function getAvailableRoutes(filters?: RouteFilters) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Build query for available routes
  let query = supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `, { count: 'exact' })
    .or(`created_by_type.eq.admin,and(created_by_type.eq.vendor,is_shared.eq.true,created_by.neq.${vendorApplication.id})`)

  // Apply filters
  if (filters?.search) {
    query = query.or(`route_name.ilike.%${filters.search}%,route_slug.ilike.%${filters.search}%`)
  }

  if (filters?.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters?.isPopular !== undefined && filters.isPopular !== 'all') {
    query = query.eq('is_popular', filters.isPopular)
  }

  if (filters?.originLocationId && filters.originLocationId !== 'all') {
    query = query.eq('origin_location_id', filters.originLocationId)
  }

  if (filters?.destinationLocationId && filters.destinationLocationId !== 'all') {
    query = query.eq('destination_location_id', filters.destinationLocationId)
  }

  // Apply pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query.range(from, to)
  query = query.order('is_popular', { ascending: false })
  query = query.order('route_name')

  const { data: routes, error, count } = await query

  if (error) {
    console.error('Error fetching available routes:', error)
    return []
  }

  return routes as RouteWithLocations[]
}

export async function getVendorRouteServices() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Get vendor route services with route details
  const { data: services, error } = await supabase
    .from('vendor_route_services')
    .select(`
      *,
      route:routes!inner(
        *,
        origin_location:locations!origin_location_id(*),
        destination_location:locations!destination_location_id(*)
      )
    `)
    .eq('vendor_id', vendorApplication.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vendor route services:', error)
    // Return empty array for any database errors during development
    console.log('Database error detected, returning empty array for vendor route services')
    return []
  }

  return services as VendorRouteServiceWithRoute[]
}

export async function toggleVendorRoute(routeId: string, isActive: boolean) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  if (isActive) {
    // First check if the service already exists
    const { data: existingService } = await supabase
      .from('vendor_route_services')
      .select('id')
      .eq('vendor_id', vendorApplication.id)
      .eq('route_id', routeId)
      .single()

    if (existingService) {
      // Update existing service to active
      const { error } = await supabase
        .from('vendor_route_services')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('vendor_id', vendorApplication.id)
        .eq('route_id', routeId)

      if (error) {
        console.error('Error updating vendor route:', error)
        throw new Error('Failed to enable route')
      }
    } else {
      // Create new service
      const { error } = await supabase
        .from('vendor_route_services')
        .insert({
          vendor_id: vendorApplication.id,
          route_id: routeId,
          is_active: true,
          price_multiplier: 1.0
        })

      if (error) {
        console.error('Error creating vendor route service:', error)
        throw new Error('Failed to enable route')
      }
    }
  } else {
    // Disable route for vendor - update existing service
    const { error } = await supabase
      .from('vendor_route_services')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('vendor_id', vendorApplication.id)
      .eq('route_id', routeId)

    if (error) {
      console.error('Error disabling vendor route:', error)
      throw new Error('Failed to disable route')
    }
  }

  revalidatePath('/vendor/routes')
}

export async function updateVendorRouteSettings(routeId: string, settings: {
  price_multiplier: number
  is_active: boolean
}) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  const { error } = await supabase
    .from('vendor_route_services')
    .update({
      price_multiplier: settings.price_multiplier,
      is_active: settings.is_active
    })
    .eq('vendor_id', vendorApplication.id)
    .eq('route_id', routeId)

  if (error) {
    console.error('Error updating vendor route settings:', error)
    throw new Error('Failed to update route settings')
  }

  revalidatePath('/vendor/routes')
}

export async function getVendorRouteMetrics() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Get route counts
  const { data: activeRoutes, error: activeError } = await supabase
    .from('vendor_route_services')
    .select('id')
    .eq('vendor_id', vendorApplication.id)
    .eq('is_active', true)

  if (activeError) {
    console.error('Error fetching active routes:', activeError)
    throw new Error('Failed to fetch route metrics')
  }

  const { data: totalRoutes, error: totalError } = await supabase
    .from('vendor_route_services')
    .select('id')
    .eq('vendor_id', vendorApplication.id)

  if (totalError) {
    console.error('Error fetching total routes:', totalError)
    throw new Error('Failed to fetch route metrics')
  }

  // Get search metrics for vendor's routes
  const { data: searchMetrics, error: searchError } = await supabase
    .from('route_searches')
    .select('id, route_id')
    .in('route_id', (await supabase
      .from('vendor_route_services')
      .select('route_id')
      .eq('vendor_id', vendorApplication.id)
      .eq('is_active', true)
    ).data?.map(s => s.route_id) || [])

  if (searchError) {
    console.error('Error fetching search metrics:', searchError)
    // Don't throw here, searches might not exist yet
  }

  return {
    activeRoutes: activeRoutes?.length || 0,
    totalRoutes: totalRoutes?.length || 0,
    totalSearches: searchMetrics?.length || 0
  }
}

export async function createVendorRoute(data: {
  origin_location_id: string
  destination_location_id: string
  route_name: string
  route_slug: string
  distance_km: number
  estimated_duration_minutes: number
  base_price: number
  is_active: boolean
  is_popular: boolean
  is_shared: boolean
}) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Validate that origin and destination are different
  if (data.origin_location_id === data.destination_location_id) {
    throw new Error('Origin and destination must be different')
  }

  // Create the route with vendor information
  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      origin_location_id: data.origin_location_id,
      destination_location_id: data.destination_location_id,
      route_name: data.route_name,
      route_slug: data.route_slug,
      distance_km: data.distance_km,
      estimated_duration_minutes: data.estimated_duration_minutes,
      base_price: data.base_price,
      is_active: data.is_active,
      is_popular: data.is_popular,
      is_shared: data.is_shared,
      created_by: vendorApplication.id,
      created_by_type: 'vendor'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating vendor route:', error)
    if (error.code === '23505') {
      // Check which constraint was violated
      if (error.message?.includes('unique_route_combination')) {
        throw new Error('A route between these locations already exists. This will be fixed when the vendor routes migration is applied.')
      } else if (error.message?.includes('route_slug')) {
        throw new Error('A route with this name already exists')
      }
      throw new Error('A route with this name or location combination already exists')
    }
    throw new Error('Failed to create route: ' + (error.message || 'Unknown error'))
  }

  revalidatePath('/vendor/routes')
  return route
}

export async function updateVendorRoute(routeId: string, data: {
  origin_location_id?: string
  destination_location_id?: string
  route_name?: string
  route_slug?: string
  distance_km?: number
  estimated_duration_minutes?: number
  base_price?: number
  is_active?: boolean
  is_popular?: boolean
  is_shared?: boolean
}) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // First check if the vendor owns this route
  const { data: existingRoute, error: checkError } = await supabase
    .from('routes')
    .select('id, created_by, created_by_type')
    .eq('id', routeId)
    .single()

  if (checkError || !existingRoute) {
    console.error('Error checking route ownership:', checkError)
    throw new Error('Route not found')
  }

  // Verify vendor owns this route
  if (existingRoute.created_by !== vendorApplication.id || existingRoute.created_by_type !== 'vendor') {
    throw new Error('You do not have permission to update this route')
  }

  // Update the route
  const { data: route, error } = await supabase
    .from('routes')
    .update(data)
    .eq('id', routeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating vendor route:', error)
    throw new Error('Failed to update route')
  }

  revalidatePath('/vendor/routes')
  return route
}

export async function deleteVendorRoute(routeId: string) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Delete the route
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', routeId)
    .eq('created_by', vendorApplication.id)
    .eq('created_by_type', 'vendor')

  if (error) {
    console.error('Error deleting vendor route:', error)
    throw new Error('Failed to delete route')
  }

  revalidatePath('/vendor/routes')
}

export async function getLocationsForRouteCreation() {
  const supabase = await createClient()

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, city, country_code, type')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    // Return empty array for any database errors during development
    console.log('Database error detected, returning empty array for locations')
    return []
  }

  return locations || []
}

export async function bulkDeleteVendorRoutes(ids: string[]) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Delete only routes created by this vendor
  const { error, count } = await supabase
    .from('routes')
    .delete()
    .in('id', ids)
    .eq('created_by', vendorApplication.id)
    .eq('created_by_type', 'vendor')

  if (error) {
    console.error('Error bulk deleting vendor routes:', error)
    throw new Error('Failed to delete routes')
  }

  revalidatePath('/vendor/routes')
  return { count: count || 0 }
}

export async function bulkUpdateVendorRoutes(ids: string[], updates: {
  is_active?: boolean
  is_popular?: boolean
  is_shared?: boolean
}) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Update only routes created by this vendor
  const { error, count } = await supabase
    .from('routes')
    .update(updates)
    .in('id', ids)
    .eq('created_by', vendorApplication.id)
    .eq('created_by_type', 'vendor')

  if (error) {
    console.error('Error bulk updating vendor routes:', error)
    throw new Error('Failed to update routes')
  }

  revalidatePath('/vendor/routes')
  return { count: count || 0 }
}

export async function getVendorRouteById(routeId: string) {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!vendorApplication) {
    throw new Error('Vendor application not found or not approved')
  }

  // Get the route with location details
  const { data: route, error } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `)
    .eq('id', routeId)
    .eq('created_by', vendorApplication.id)
    .eq('created_by_type', 'vendor')
    .single()

  if (error) {
    console.error('Error fetching vendor route:', error)
    return null
  }

  return route as RouteWithLocations
}