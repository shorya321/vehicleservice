'use server'

import { createClient } from '@/lib/supabase/server'
import { trackRouteSearch } from '@/app/actions'

export interface SearchResultVehicle {
  id: string
  name: string
  category: string
  categoryId?: string
  capacity: number
  luggageCapacity: number
  images: string[]
  features: string[]
  vendorName: string
  vendorRating: number
  price: number
  originalPrice?: number
  duration: string
  cancellationPolicy: string
  instantConfirmation: boolean
}

export interface RouteResult {
  id: string
  routeName: string
  destinationId: string
  destinationName: string
  destinationType: string
  distance: number
  duration: number
  minPrice: number
  availableVehicles: number
}

export interface CategoryResult {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  vehicleCount: number
  minPrice: number
}

export interface VehiclesByCategory {
  categoryId: string
  categoryName: string
  categorySlug: string
  vehicles: SearchResultVehicle[]
  minPrice: number
}

export interface SearchResult {
  type: 'route' | 'routes' | 'categories'
  originName: string
  destinationName?: string
  routeId?: string
  routeName?: string
  distance?: number
  vehicles?: SearchResultVehicle[]
  vehiclesByCategory?: VehiclesByCategory[]
  routes?: RouteResult[]
  categories?: CategoryResult[]
}

export async function getSearchResults(params: {
  originId: string
  destinationId?: string
  routeId?: string
  date: Date
  passengers: number
}): Promise<SearchResult | null> {
  const supabase = await createClient()

  // Get origin location details
  const originDetails = await getLocationDetails(params.originId)
  if (!originDetails) return null

  // If no destination, return popular routes or categories
  if (!params.destinationId) {
    return getLocationSearchResults(params.originId, originDetails.name, params.passengers)
  }

  // Get destination details
  const destinationDetails = await getLocationDetails(params.destinationId)
  if (!destinationDetails) return null

  // Check if we have a specific route ID in params (when user selects a route)
  const routeId = params.routeId

  if (!routeId) {
    // No route selected, show available routes between origin and destination
    return getRoutesForDestination(params.originId, params.destinationId, originDetails.name, destinationDetails.name, params.passengers)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  // Find the specific route
  const { data: route, error: routeError } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      distance_km,
      estimated_duration_minutes,
      base_price
    `)
    .eq('id', routeId)
    .eq('is_active', true)
    .single()

  if (routeError || !route) {
    console.error('Route not found:', routeError)
    return null
  }

  // Track the search
  await trackRouteSearch({
    routeId: route.id,
    originLocationId: params.originId,
    destinationLocationId: params.destinationId,
    passengerCount: params.passengers,
    userId: user?.id
  })

  // Get vehicles available for this route
  const { data: vendorRoutes, error: vendorRoutesError } = await supabase
    .from('vendor_route_services')
    .select(`
      id,
      vendor_id,
      is_active,
      price_multiplier,
      vendor_applications!inner(
        id,
        business_name
      )
    `)
    .eq('route_id', route.id)
    .eq('is_active', true)

  if (vendorRoutesError) {
    console.error('Error fetching vendor routes:', vendorRoutesError)
    return {
      routeId: route.id,
      routeName: route.route_name,
      distance: route.distance_km,
      vehicles: []
    }
  }

  const vendorApplicationIds = vendorRoutes.map(vr => vr.vendor_id)
  
  // Get vehicles directly using vendor_application IDs (which are the business_ids in vehicles table)
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      seats,
      gallery_images,
      is_available,
      business_id,
      category_id,
      vehicle_categories!category_id(
        id,
        name,
        slug,
        sort_order
      )
    `)
    .in('business_id', vendorApplicationIds)
    .gte('seats', params.passengers)
    .eq('is_available', true)

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError)
    return {
      routeId: route.id,
      routeName: route.route_name,
      distance: route.distance_km,
      vehicles: []
    }
  }

  // Map vehicles to search results
  const searchVehicles: SearchResultVehicle[] = vehicles.map(vehicle => {
    // Find the vendor route service for this vehicle's business (vendor application)
    const vendorRoute = vendorRoutes.find(vr => vr.vendor_id === vehicle.business_id)
    const vendor = vendorRoute?.vendor_applications
    
    const categoryMultiplier = 1 // Default multiplier since column doesn't exist
    const priceMultiplier = vendorRoute?.price_multiplier || 1
    const calculatedPrice = route.base_price * categoryMultiplier * priceMultiplier
    
    // Calculate duration
    const hours = Math.floor(route.estimated_duration_minutes / 60)
    const mins = route.estimated_duration_minutes % 60
    const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model}`,
      category: vehicle.vehicle_categories?.name || 'Standard',
      categoryId: vehicle.category_id || 'uncategorized',
      capacity: vehicle.seats || 4,
      luggageCapacity: 2, // Default value since column doesn't exist
      images: Array.isArray(vehicle.gallery_images) ? vehicle.gallery_images : [],
      features: [], // Features not available in current schema
      vendorName: vendor?.business_name || 'Unknown Vendor',
      vendorRating: 4.5, // Default rating since rating column doesn't exist
      price: calculatedPrice,
      originalPrice: calculatedPrice > route.base_price ? calculatedPrice * 1.2 : undefined, // Show original price if discounted
      duration,
      cancellationPolicy: 'Free cancellation up to 24 hours before',
      instantConfirmation: true
    }
  })

  // Sort by price
  searchVehicles.sort((a, b) => a.price - b.price)

  // Group vehicles by category
  const vehiclesByCategory: VehiclesByCategory[] = []
  const categoryMap = new Map<string, VehiclesByCategory>()

  // First, get all unique categories
  const { data: allCategories } = await supabase
    .from('vehicle_categories')
    .select('*')
    .order('sort_order')
    .order('name')

  // Initialize categories
  if (allCategories) {
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        vehicles: [],
        minPrice: Number.MAX_VALUE
      })
    })
  }

  // Add "uncategorized" for vehicles without category
  categoryMap.set('uncategorized', {
    categoryId: 'uncategorized',
    categoryName: 'Standard',
    categorySlug: 'standard',
    vehicles: [],
    minPrice: Number.MAX_VALUE
  })

  // Group vehicles
  searchVehicles.forEach(vehicle => {
    const categoryId = vehicle.categoryId || 'uncategorized'
    const category = categoryMap.get(categoryId)
    
    if (category) {
      category.vehicles.push(vehicle)
      category.minPrice = Math.min(category.minPrice, vehicle.price)
    }
  })

  // Convert to array and filter out empty categories
  vehiclesByCategory.push(...Array.from(categoryMap.values())
    .filter(cat => cat.vehicles.length > 0)
    .sort((a, b) => {
      // Sort by sort_order if available, otherwise by name
      const catA = allCategories?.find(c => c.id === a.categoryId)
      const catB = allCategories?.find(c => c.id === b.categoryId)
      
      if (catA?.sort_order !== undefined && catB?.sort_order !== undefined) {
        return catA.sort_order - catB.sort_order
      }
      return a.categoryName.localeCompare(b.categoryName)
    }))

  return {
    type: 'route',
    originName: originDetails.name,
    destinationName: destinationDetails.name,
    routeId: route.id,
    routeName: route.route_name,
    distance: route.distance_km,
    vehicles: searchVehicles,
    vehiclesByCategory
  }
}

export async function getLocationDetails(locationId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, city, country_code')
    .eq('id', locationId)
    .single()

  if (error) {
    console.error('Error fetching location:', error)
    return null
  }

  return data
}

async function getLocationSearchResults(
  originId: string, 
  originName: string,
  passengers: number
): Promise<SearchResult> {
  const supabase = await createClient()
  
  // First, try to get popular routes from this location
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      distance_km,
      estimated_duration_minutes,
      base_price,
      destination:destination_location_id(
        id,
        name,
        type
      )
    `)
    .eq('origin_location_id', originId)
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
    .order('route_name')
    .limit(10)

  if (!routesError && routes && routes.length > 0) {
    // Get vendor route services to calculate min prices
    const routeIds = routes.map(r => r.id)
    
    const { data: vendorRoutes } = await supabase
      .from('vendor_route_services')
      .select(`
        route_id,
        price_multiplier,
        vendor_id
      `)
      .in('route_id', routeIds)
      .eq('is_active', true)

    // Get vehicle counts
    const vendorIds = vendorRoutes?.map(vr => vr.vendor_id) || []
    
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, business_id, seats')
      .in('business_id', vendorIds)
      .eq('is_available', true)
      .gte('seats', passengers)

    // Map routes with pricing and availability
    const routeResults: RouteResult[] = routes.map(route => {
      const routeVendors = vendorRoutes?.filter(vr => vr.route_id === route.id) || []
      const minMultiplier = Math.min(...routeVendors.map(rv => rv.price_multiplier || 1), 1)
      const minPrice = route.base_price * minMultiplier
      
      const routeVendorIds = routeVendors.map(rv => rv.vendor_id)
      const availableVehicles = vehicles?.filter(v => 
        routeVendorIds.includes(v.business_id)
      ).length || 0

      return {
        id: route.id,
        routeName: route.route_name,
        destinationId: route.destination.id,
        destinationName: route.destination.name,
        destinationType: route.destination.type,
        distance: route.distance_km,
        duration: route.estimated_duration_minutes,
        minPrice,
        availableVehicles
      }
    })

    return {
      type: 'routes',
      originName,
      routes: routeResults
    }
  }

  // If no routes, get vehicle categories
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('*')
    .order('sort_order')
    .order('name')

  // Get vehicle counts for each category in this location
  const { data: vendorApplications } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('status', 'approved')

  const vendorIds = vendorApplications?.map(va => va.id) || []
  
  const { data: vehiclesByCategory } = await supabase
    .from('vehicles')
    .select('category_id, daily_rate')
    .in('business_id', vendorIds)
    .eq('is_available', true)
    .gte('seats', passengers)

  const categoryResults: CategoryResult[] = (categories || []).map(category => {
    const categoryVehicles = vehiclesByCategory?.filter(v => v.category_id === category.id) || []
    const uncategorizedVehicles = category.slug === 'standard' 
      ? vehiclesByCategory?.filter(v => !v.category_id) || []
      : []
    
    const allVehicles = [...categoryVehicles, ...uncategorizedVehicles]
    const vehicleCount = allVehicles.length
    const minPrice = allVehicles.length > 0 
      ? Math.min(...allVehicles.map(v => v.daily_rate))
      : 0

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      vehicleCount,
      minPrice
    }
  }).filter(cat => cat.vehicleCount > 0)

  // Add "Standard" category for uncategorized vehicles if needed
  const uncategorizedCount = vehiclesByCategory?.filter(v => !v.category_id).length || 0
  if (uncategorizedCount > 0 && !categoryResults.find(c => c.slug === 'standard')) {
    const uncategorizedVehicles = vehiclesByCategory?.filter(v => !v.category_id) || []
    const minPrice = Math.min(...uncategorizedVehicles.map(v => v.daily_rate))
    
    categoryResults.push({
      id: 'uncategorized',
      name: 'Standard Vehicles',
      slug: 'standard',
      description: 'Comfortable vehicles for your transfer',
      imageUrl: null,
      vehicleCount: uncategorizedCount,
      minPrice
    })
  }

  return {
    type: 'categories',
    originName,
    categories: categoryResults
  }
}

async function getRoutesForDestination(
  originId: string,
  destinationId: string,
  originName: string,
  destinationName: string,
  passengers: number
): Promise<SearchResult> {
  const supabase = await createClient()
  
  // Get all routes between origin and destination
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      distance_km,
      estimated_duration_minutes,
      base_price
    `)
    .eq('origin_location_id', originId)
    .eq('destination_location_id', destinationId)
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
    .order('route_name')

  if (routesError || !routes || routes.length === 0) {
    // No direct routes, return categories as fallback
    const { data: categories } = await supabase
      .from('vehicle_categories')
      .select('*')
      .order('sort_order')
      .order('name')

    const categoryResults: CategoryResult[] = (categories || []).map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      vehicleCount: 0, // Would need to fetch actual counts
      minPrice: 0
    }))

    return {
      type: 'categories',
      originName,
      destinationName,
      categories: categoryResults
    }
  }

  // Get vendor route services to calculate min prices and availability
  const routeIds = routes.map(r => r.id)
  
  const { data: vendorRoutes } = await supabase
    .from('vendor_route_services')
    .select(`
      route_id,
      price_multiplier,
      vendor_id
    `)
    .in('route_id', routeIds)
    .eq('is_active', true)

  // Get vehicle counts
  const vendorIds = vendorRoutes?.map(vr => vr.vendor_id) || []
  
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, business_id, seats')
    .in('business_id', vendorIds)
    .eq('is_available', true)
    .gte('seats', passengers)

  // Map routes with pricing and availability
  const routeResults: RouteResult[] = routes.map(route => {
    const routeVendors = vendorRoutes?.filter(vr => vr.route_id === route.id) || []
    const minMultiplier = Math.min(...routeVendors.map(rv => rv.price_multiplier || 1), 1)
    const minPrice = route.base_price * minMultiplier
    
    const routeVendorIds = routeVendors.map(rv => rv.vendor_id)
    const availableVehicles = vehicles?.filter(v => 
      routeVendorIds.includes(v.business_id)
    ).length || 0

    return {
      id: route.id,
      routeName: route.route_name,
      destinationId: destinationId,
      destinationName: destinationName,
      destinationType: 'city', // Would need to fetch actual type
      distance: route.distance_km,
      duration: route.estimated_duration_minutes,
      minPrice,
      availableVehicles
    }
  })

  return {
    type: 'routes',
    originName,
    destinationName,
    routes: routeResults
  }
}