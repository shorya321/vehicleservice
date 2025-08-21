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

export interface ZoneResult {
  fromZone: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  toZone: {
    id: string
    name: string
    slug: string
    description: string | null
  }
  basePrice: number
  currency: string
  vehicleTypes: VehicleTypeResult[]
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
  type: 'route' | 'routes' | 'categories' | 'redirect' | 'zone' | 'zones'
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
  zone?: ZoneResult
  zones?: ZoneResult[]
  categories?: CategoryResult[]
  redirectTo?: string
}

export async function getSearchResults(params: {
  originId?: string
  destinationId?: string
  fromZoneId?: string
  toZoneId?: string
  routeId?: string
  date: Date
  passengers: number
}): Promise<SearchResult | null> {
  try {
    const supabase = await createClient()

  // Handle direct zone-to-zone search
  if (params.fromZoneId && params.toZoneId) {
    return getZoneToZoneResults(params.fromZoneId, params.toZoneId, params.passengers)
  }

  // Handle route-based search (from Popular Routes)
  if (params.routeId && !params.originId) {
    return getRouteById(params.routeId, params.passengers)
  }

  // Handle location-based search
  if (!params.originId) {
    return null
  }

  // Get origin location details with zone information
  const originDetails = await getLocationDetailsWithZone(params.originId)
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

  // Get destination details with zone information
  const destinationDetails = await getLocationDetailsWithZone(params.destinationId)
  if (!destinationDetails) {
    // Destination doesn't exist, return empty zones
    return {
      type: 'zones',
      originName: originDetails.name,
      destinationName: 'Unknown Location',
      zones: []
    }
  }

  // NEW ZONE-BASED LOGIC
  // Check if both locations have zones assigned
  if (originDetails.zone_id && destinationDetails.zone_id) {
    // Get zone information for both locations
    const { data: zones } = await supabase
      .from('zones')
      .select('*')
      .in('id', [originDetails.zone_id, destinationDetails.zone_id])

    if (zones && zones.length > 0) {
      const fromZone = zones.find(z => z.id === originDetails.zone_id)
      const toZone = zones.find(z => z.id === destinationDetails.zone_id)

      if (fromZone && toZone) {
        // Get zone pricing
        const { data: zonePricing } = await supabase
          .from('zone_pricing')
          .select('*')
          .eq('from_zone_id', fromZone.id)
          .eq('to_zone_id', toZone.id)
          .eq('is_active', true)
          .single()

        if (zonePricing) {
          // Get vehicle types for this zone transfer
          const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForZoneTransfer(
            fromZone.id,
            toZone.id,
            zonePricing.base_price,
            params.passengers
          )

          // Count available vehicles
          const availableVehicles = vehicleTypes.reduce((sum, vt) => sum + vt.availableVehicles, 0)

          return {
            type: 'zone',
            originName: originDetails.name,
            destinationName: destinationDetails.name,
            zone: {
              fromZone: {
                id: fromZone.id,
                name: fromZone.name,
                slug: fromZone.slug,
                description: fromZone.description
              },
              toZone: {
                id: toZone.id,
                name: toZone.name,
                slug: toZone.slug,
                description: toZone.description
              },
              basePrice: zonePricing.base_price,
              currency: zonePricing.currency || 'USD',
              vehicleTypes,
              availableVehicles
            },
            vehicleTypes,
            vehicleTypesByCategory
          }
        }
      }
    }
  }

  // FALLBACK: If zones not found, check for routes (backward compatibility)
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
      ),
      vehicle_types!vehicle_type_id(
        price_multiplier
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

  // Get zone-based pricing
  let zonePrice = route.base_price // Fallback to route base price
  if (originDetails.zone_id && destinationDetails.zone_id) {
    const { data: zonePricingData, error: zonePricingError } = await supabase
      .from('zone_pricing')
      .select('base_price')
      .eq('from_zone_id', originDetails.zone_id)
      .eq('to_zone_id', destinationDetails.zone_id)
      .eq('is_active', true)
      .single()

    if (!zonePricingError && zonePricingData) {
      zonePrice = zonePricingData.base_price
    } else {
      console.error('Error fetching zone pricing:', zonePricingError)
    }
  }

  // Map vehicles to search results
  const searchVehicles: SearchResultVehicle[] = vehicles.map(vehicle => {
    // Find the vendor route service for this vehicle's business (vendor application)
    const vendorRoute = vendorRoutes.find(vr => vr.vendor_id === vehicle.business_id)
    const vendor = vendorRoute?.vendor_applications
    
    // Calculate price using zone base price and vehicle type multiplier
    const vehicleTypeMultiplier = vehicle.vehicle_types?.price_multiplier || 1.0
    const calculatedPrice = zonePrice * vehicleTypeMultiplier
    
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

  // Get vehicle types for this route with zone-based pricing
  const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForRoute(
    route.id, 
    params.passengers,
    originDetails.zone_id,
    destinationDetails.zone_id
  )

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

async function getVehicleTypesForZoneTransfer(
  fromZoneId: string,
  toZoneId: string,
  basePrice: number,
  passengers: number
): Promise<{
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
}> {
  const supabase = await createClient()
  
  // Get vehicle types with pricing for zone transfer
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
      price_multiplier,
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

  // Process data into VehicleTypeResult format with zone-based pricing
  const vehicleTypes: VehicleTypeResult[] = vehicleTypesData.map(vt => {
    // Calculate price using zone base price and vehicle type multiplier
    const multiplier = vt.price_multiplier || 1.0
    const calculatedPrice = basePrice * multiplier

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
      price: calculatedPrice,
      currency: 'USD',
      availableVehicles: 0, // Will be updated with actual count
      vendorCount: 0, // Will be updated with actual count
      features: [],
      image: vt.image_url || undefined
    }
  })

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

async function getVehicleTypesForRoute(
  routeId: string, 
  passengers: number,
  fromZoneId?: string,
  toZoneId?: string
): Promise<{
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
      price_multiplier,
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

  // Get zone-based pricing if zones are provided
  let zonePrice = 50 // Default base price
  if (fromZoneId && toZoneId) {
    const { data: zonePricingData, error: zonePricingError } = await supabase
      .from('zone_pricing')
      .select('base_price')
      .eq('from_zone_id', fromZoneId)
      .eq('to_zone_id', toZoneId)
      .eq('is_active', true)
      .single()

    if (!zonePricingError && zonePricingData) {
      zonePrice = zonePricingData.base_price
    } else {
      console.error('Error fetching zone pricing:', zonePricingError)
    }
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

  // Get vehicle type IDs from the fetched data
  const vehicleTypeIds = vehicleTypesData.map(vt => vt.id)

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

  // Process data into VehicleTypeResult format with zone-based pricing
  const vehicleTypes: VehicleTypeResult[] = vehicleTypesData.map(vt => {
    // Calculate price using zone base price and vehicle type multiplier
    const multiplier = vt.price_multiplier || 1.0
    const calculatedPrice = zonePrice * multiplier
    
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
      price: calculatedPrice,
      currency: 'USD',
      availableVehicles: vehiclesOfType.length,
      vendorCount: vendorsWithType,
      features: [], // TODO: Add features if needed
      image: vt.image_url || undefined
    }
  })

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

async function getRouteById(
  routeId: string,
  passengers: number
): Promise<SearchResult | null> {
  const supabase = await createClient()

  // Get route details with location information
  const { data: route, error } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!routes_origin_location_id_fkey(*),
      destination_location:locations!routes_destination_location_id_fkey(*)
    `)
    .eq('id', routeId)
    .eq('is_active', true)
    .single()

  if (error || !route) {
    console.error('Error fetching route:', error)
    return null
  }

  // Check if both locations have zones for zone-based pricing
  if (route.origin_location.zone_id && route.destination_location.zone_id) {
    // Get zone information
    const { data: zones } = await supabase
      .from('zones')
      .select('*')
      .in('id', [route.origin_location.zone_id, route.destination_location.zone_id])

    if (zones && zones.length === 2) {
      const fromZone = zones.find(z => z.id === route.origin_location.zone_id)
      const toZone = zones.find(z => z.id === route.destination_location.zone_id)

      if (fromZone && toZone) {
        // Get zone pricing
        const { data: zonePricing } = await supabase
          .from('zone_pricing')
          .select('*')
          .eq('from_zone_id', fromZone.id)
          .eq('to_zone_id', toZone.id)
          .eq('is_active', true)
          .single()

        if (zonePricing) {
          // Get vehicle types with zone-based pricing
          const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForZoneTransfer(
            fromZone.id,
            toZone.id,
            zonePricing.base_price,
            passengers
          )

          return {
            type: 'zone',
            originName: route.origin_location.name,
            destinationName: route.destination_location.name,
            zone: {
              fromZone: {
                id: fromZone.id,
                name: fromZone.name,
                slug: fromZone.slug,
                description: fromZone.description
              },
              toZone: {
                id: toZone.id,
                name: toZone.name,
                slug: toZone.slug,
                description: toZone.description
              },
              basePrice: zonePricing.base_price,
              currency: zonePricing.currency || 'USD',
              vehicleTypes,
              availableVehicles: vehicleTypes.reduce((sum, vt) => sum + vt.availableVehicles, 0)
            },
            vehicleTypes,
            vehicleTypesByCategory
          }
        }
      }
    }
  }

  // Fallback to route-based pricing if zones not available
  const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForRoute(
    routeId,
    passengers,
    route.origin_location.zone_id,
    route.destination_location.zone_id
  )

  return {
    type: 'route',
    originName: route.origin_location.name,
    destinationName: route.destination_location.name,
    route: {
      id: route.id,
      routeName: route.route_name,
      destinationId: route.destination_location_id,
      destinationName: route.destination_location.name,
      destinationType: route.destination_location.type,
      distance: route.distance_km,
      duration: route.estimated_duration_minutes,
      minPrice: route.base_price,
      availableVehicles: vehicleTypes.length
    },
    vehicles: [],
    vehicleTypes,
    vehicleTypesByCategory
  }
}

async function getZoneToZoneResults(
  fromZoneId: string,
  toZoneId: string,
  passengers: number
): Promise<SearchResult | null> {
  const supabase = await createClient()

  // Get both zones information
  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .in('id', [fromZoneId, toZoneId])

  if (!zones || zones.length !== 2) {
    return null
  }

  const fromZone = zones.find(z => z.id === fromZoneId)
  const toZone = zones.find(z => z.id === toZoneId)

  if (!fromZone || !toZone) {
    return null
  }

  // Get zone pricing
  const { data: zonePricing } = await supabase
    .from('zone_pricing')
    .select('*')
    .eq('from_zone_id', fromZoneId)
    .eq('to_zone_id', toZoneId)
    .eq('is_active', true)
    .single()

  if (!zonePricing) {
    return {
      type: 'zone',
      originName: fromZone.name,
      destinationName: toZone.name,
      zone: {
        fromZone: {
          id: fromZone.id,
          name: fromZone.name,
          slug: fromZone.slug,
          description: fromZone.description
        },
        toZone: {
          id: toZone.id,
          name: toZone.name,
          slug: toZone.slug,
          description: toZone.description
        },
        basePrice: 0,
        currency: 'USD',
        vehicleTypes: [],
        availableVehicles: 0
      },
      vehicleTypes: [],
      vehicleTypesByCategory: []
    }
  }

  // Get vehicle types for this zone transfer
  const { vehicleTypes, vehicleTypesByCategory } = await getVehicleTypesForZoneTransfer(
    fromZoneId,
    toZoneId,
    zonePricing.base_price,
    passengers
  )

  // Count available vehicles
  const availableVehicles = vehicleTypes.reduce((sum, vt) => sum + vt.availableVehicles, 0)

  return {
    type: 'zone',
    originName: fromZone.name,
    destinationName: toZone.name,
    zone: {
      fromZone: {
        id: fromZone.id,
        name: fromZone.name,
        slug: fromZone.slug,
        description: fromZone.description
      },
      toZone: {
        id: toZone.id,
        name: toZone.name,
        slug: toZone.slug,
        description: toZone.description
      },
      basePrice: zonePricing.base_price,
      currency: zonePricing.currency || 'USD',
      vehicleTypes,
      availableVehicles
    },
    vehicleTypes,
    vehicleTypesByCategory
  }
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

async function getLocationDetailsWithZone(locationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, country_code, slug, zone_id')
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