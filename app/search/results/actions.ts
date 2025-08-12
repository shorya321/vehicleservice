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

export interface VehicleTypeResult {
  id: string
  name: string
  slug: string
  category: string
  categoryId: string
  categorySlug: string
  capacity: number
  luggageCapacity: number
  description: string
  price: number
  currency: string
  availableVehicles: number
  vendorCount: number
  features: string[]
  image?: string
}

export interface VehicleTypesByCategory {
  categoryId: string
  categoryName: string
  categorySlug: string
  vehicleTypes: VehicleTypeResult[]
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
  type: 'route' | 'routes' | 'categories' | 'redirect'
  originName: string
  destinationName?: string
  routeId?: string
  routeName?: string
  distance?: number
  vehicles?: SearchResultVehicle[]
  vehiclesByCategory?: VehiclesByCategory[]
  vehicleTypes?: VehicleTypeResult[]
  vehicleTypesByCategory?: VehicleTypesByCategory[]
  routes?: RouteResult[]
  categories?: CategoryResult[]
  redirectTo?: string
}

export async function getSearchResults(params: {
  originId: string
  destinationId?: string
  routeId?: string
  date: Date
  passengers: number
}): Promise<SearchResult | null> {
  try {
    const supabase = await createClient()

  // Get origin location details
  const originDetails = await getLocationDetails(params.originId)
  if (!originDetails) {
    // Origin location doesn't exist, return empty routes
    return {
      type: 'routes',
      originName: 'Unknown Location',
      destinationName: 'Unknown Location',
      routes: []
    }
  }

  // If no destination, return popular routes or categories
  if (!params.destinationId) {
    return getLocationSearchResults(params.originId, originDetails.name, params.passengers)
  }

  // Get destination details
  const destinationDetails = await getLocationDetails(params.destinationId)
  if (!destinationDetails) {
    // Destination doesn't exist, return empty routes
    return {
      type: 'routes',
      originName: originDetails.name,
      destinationName: 'Unknown Location',
      routes: []
    }
  }

  // Check if we have a specific route ID in params (when user selects a route)
  const routeId = params.routeId

  if (!routeId) {
    // No route selected, check available routes between origin and destination
    const routesResult = await getRoutesForDestination(params.originId, params.destinationId, originDetails.name, destinationDetails.name, params.passengers)
    
    // If only one route exists, return redirect to the route page
    if (routesResult && routesResult.type === 'routes' && routesResult.routes && routesResult.routes.length === 1) {
      const singleRoute = routesResult.routes[0]
      
      // Get the route details to construct the redirect URL
      const { data: routeData } = await supabase
        .from('routes')
        .select(`
          route_slug,
          origin:origin_location_id(country_slug)
        `)
        .eq('id', singleRoute.id)
        .single()
      
      if (routeData && routeData.route_slug && routeData.origin?.country_slug) {
        return {
          type: 'redirect',
          originName: originDetails.name,
          destinationName: destinationDetails.name,
          redirectTo: `/search/route/${routeData.origin.country_slug}/${routeData.route_slug}`
        }
      }
      
      // Fallback to showing vehicle types if we can't get route details
      return getSearchResults({
        ...params,
        routeId: singleRoute.id
      })
    }
    
    // Otherwise return the routes list
    return routesResult
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
      vehicle_type_id,
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

  // Get pricing data for vehicle types on this route
  const vehicleTypeIds = [...new Set(vehicles.map(v => v.vehicle_type_id).filter(Boolean))]
  const { data: pricingData, error: pricingError } = await supabase
    .from('route_vehicle_type_pricing')
    .select('*')
    .eq('route_id', route.id)
    .in('vehicle_type_id', vehicleTypeIds)
    .eq('is_active', true)

  if (pricingError) {
    console.error('Error fetching pricing data:', pricingError)
  }

  // Map vehicles to search results
  const searchVehicles: SearchResultVehicle[] = vehicles.map(vehicle => {
    // Find the vendor route service for this vehicle's business (vendor application)
    const vendorRoute = vendorRoutes.find(vr => vr.vendor_id === vehicle.business_id)
    const vendor = vendorRoute?.vendor_applications
    
    // Get pricing for this vehicle type
    const vehiclePricing = pricingData?.find(p => p.vehicle_type_id === vehicle.vehicle_type_id)
    const calculatedPrice = vehiclePricing?.price || route.base_price
    
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

  // Get vehicle types for this route
  const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForRoute(route.id, params.passengers)

  return {
    type: 'route',
    originName: originDetails.name,
    destinationName: destinationDetails.name,
    routeId: route.id,
    routeName: route.route_name,
    distance: route.distance_km,
    vehicles: searchVehicles,
    vehiclesByCategory,
    vehicleTypes,
    vehicleTypesByCategory
  }
  } catch (error) {
    console.error('Error in getSearchResults:', error)
    return null
  }
}

async function getVehicleTypesForRoute(routeId: string, passengers: number): Promise<{
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
}> {
  const supabase = await createClient()
  
  // Get vehicle types with pricing for this route
  const { data: vehicleTypesData, error: typesError } = await supabase
    .from('vehicle_types')
    .select(`
      id,
      name,
      slug,
      passenger_capacity,
      luggage_capacity,
      description,
      category_id,
      image_url,
      vehicle_categories!category_id(
        id,
        name,
        slug,
        sort_order
      )
    `)
    .gte('passenger_capacity', passengers)
    .eq('is_active', true)
    .order('passenger_capacity', { ascending: true })

  if (typesError || !vehicleTypesData) {
    console.error('Error fetching vehicle types:', typesError)
    return { vehicleTypes: [], vehicleTypesByCategory: [] }
  }

  // Get pricing for these vehicle types on this route
  const vehicleTypeIds = vehicleTypesData.map(vt => vt.id)
  const { data: pricingData, error: pricingError } = await supabase
    .from('route_vehicle_type_pricing')
    .select('*')
    .eq('route_id', routeId)
    .in('vehicle_type_id', vehicleTypeIds)
    .eq('is_active', true)

  if (pricingError) {
    console.error('Error fetching pricing data:', pricingError)
  }

  // Get vendor route services to count available vehicles
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('vendor_route_services')
    .select(`
      vendor_id,
      vendor_applications!inner(
        id,
        business_name
      )
    `)
    .eq('route_id', routeId)
    .eq('is_active', true)

  if (vendorError) {
    console.error('Error fetching vendor routes:', vendorError)
  }

  const vendorIds = vendorRoutes?.map(vr => vr.vendor_id) || []

  // Get vehicle counts per type
  const { data: vehicleCounts, error: vehicleCountError } = await supabase
    .from('vehicles')
    .select('vehicle_type_id, id, business_id')
    .in('business_id', vendorIds)
    .in('vehicle_type_id', vehicleTypeIds)
    .eq('is_available', true)

  if (vehicleCountError) {
    console.error('Error fetching vehicle counts:', vehicleCountError)
  }

  // Process data into VehicleTypeResult format
  const vehicleTypes: VehicleTypeResult[] = vehicleTypesData.map(vt => {
    const pricing = pricingData?.find(p => p.vehicle_type_id === vt.id)
    const vehiclesOfType = vehicleCounts?.filter(v => v.vehicle_type_id === vt.id) || []
    const vendorsWithType = new Set(
      vehicleCounts
        ?.filter(v => v.vehicle_type_id === vt.id)
        .map(v => vendorRoutes?.find(vr => vr.vendor_id === v.business_id)?.vendor_id)
        .filter(Boolean)
    ).size

    return {
      id: vt.id,
      name: vt.name,
      slug: vt.slug,
      category: vt.vehicle_categories?.name || 'Standard',
      categoryId: vt.category_id || '',
      categorySlug: vt.vehicle_categories?.slug || 'standard',
      capacity: vt.passenger_capacity,
      luggageCapacity: vt.luggage_capacity,
      description: vt.description || '',
      price: pricing?.price || 0,
      currency: pricing?.currency || 'USD',
      availableVehicles: vehiclesOfType.length,
      vendorCount: vendorsWithType,
      features: [], // TODO: Add features if needed
      image: vt.image_url || undefined
    }
  }).filter(vt => vt.price > 0) // Only show types with pricing

  // Group by category
  const categories = new Map<string, VehicleTypesByCategory>()
  
  vehicleTypes.forEach(vt => {
    if (!categories.has(vt.categoryId)) {
      categories.set(vt.categoryId, {
        categoryId: vt.categoryId,
        categoryName: vt.category,
        categorySlug: vt.categorySlug,
        vehicleTypes: [],
        minPrice: Number.MAX_VALUE
      })
    }
    
    const category = categories.get(vt.categoryId)!
    category.vehicleTypes.push(vt)
    category.minPrice = Math.min(category.minPrice, vt.price)
  })

  const vehicleTypesByCategory = Array.from(categories.values())
    .sort((a, b) => a.minPrice - b.minPrice)

  return { vehicleTypes, vehicleTypesByCategory }
}

export async function getLocationDetails(locationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, country_code, slug')
      .eq('id', locationId)
      .maybeSingle()

    if (error || !data) {
      if (error) {
        console.error('Error fetching location:', error)
      }
      // Return null to indicate location doesn't exist
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to fetch location details:', error)
    // Return null to indicate location doesn't exist
    return null
  }
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
      // Use base price for now, pricing will be determined by vehicle type
      const minPrice = route.base_price
      
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
    // No direct routes found
    // Try to get the origin location details to see if we can redirect
    const { data: originLocation, error: locationError } = await supabase
      .from('locations')
      .select('slug, country_slug')
      .eq('id', originId)
      .maybeSingle()

    // Only redirect if origin location exists AND has valid slug/country_slug
    if (!locationError && originLocation && originLocation.slug && originLocation.country_slug) {
      const countrySlug = originLocation.country_slug
      const locationSlug = originLocation.slug
      
      return {
        type: 'redirect',
        originName,
        destinationName,
        redirectTo: `/search/location/${countrySlug}/${locationSlug}`
      }
    }

    // Otherwise show empty routes (no redirect to avoid 404)
    return {
      type: 'routes',
      originName,
      destinationName,
      routes: []
    }
  }

  // Get vendor route services to calculate min prices and availability
  const routeIds = routes.map(r => r.id)
  
  const { data: vendorRoutes } = await supabase
    .from('vendor_route_services')
    .select(`
      route_id,
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
    // Use base price for now, pricing will be determined by vehicle type
    const minPrice = route.base_price
    
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