'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface RouteVehicleTypePricing {
  id: string
  route_id: string
  vehicle_type_id: string
  price: number
  currency: string
  is_active: boolean
  vehicle_type?: {
    id: string
    name: string
    slug: string
    passenger_capacity: number
    luggage_capacity: number
    category?: {
      id: string
      name: string
      slug: string
    }
  }
}

export interface RoutePricingData {
  route: {
    id: string
    route_name: string
    route_slug: string
    base_price: number
    origin: {
      name: string
    }
    destination: {
      name: string
    }
  }
  pricing: RouteVehicleTypePricing[]
}

export async function getRoutePricing(routeId: string): Promise<RoutePricingData | null> {
  await requireAdmin()
  const supabase = await createClient()

  // Get route details
  const { data: route, error: routeError } = await supabase
    .from('routes')
    .select(`
      id,
      route_name,
      route_slug,
      base_price,
      origin:origin_location_id(name),
      destination:destination_location_id(name)
    `)
    .eq('id', routeId)
    .single()

  if (routeError || !route) {
    console.error('Error fetching route:', routeError)
    return null
  }

  // Get all vehicle types with their pricing for this route
  const { data: vehicleTypes, error: typesError } = await supabase
    .from('vehicle_types')
    .select(`
      id,
      name,
      slug,
      passenger_capacity,
      luggage_capacity,
      category:category_id(
        id,
        name,
        slug
      )
    `)
    .eq('is_active', true)
    .order('sort_order')

  if (typesError) {
    console.error('Error fetching vehicle types:', typesError)
    return null
  }

  // Get existing pricing for this route
  const { data: existingPricing, error: pricingError } = await supabase
    .from('route_vehicle_type_pricing')
    .select('*')
    .eq('route_id', routeId)

  if (pricingError) {
    console.error('Error fetching pricing:', pricingError)
    return null
  }

  // Map pricing data
  const pricingMap = new Map(
    existingPricing?.map(p => [p.vehicle_type_id, p]) || []
  )

  // Combine vehicle types with their pricing
  const pricing = vehicleTypes.map(vt => {
    const existingPrice = pricingMap.get(vt.id)
    return {
      id: existingPrice?.id || '',
      route_id: routeId,
      vehicle_type_id: vt.id,
      price: existingPrice?.price || calculateDefaultPrice(route.base_price, vt.slug),
      currency: existingPrice?.currency || 'USD',
      is_active: existingPrice?.is_active ?? true,
      vehicle_type: vt
    }
  })

  return {
    route,
    pricing
  }
}

// Helper function to calculate default price based on vehicle type
function calculateDefaultPrice(basePrice: number, vehicleTypeSlug: string): number {
  const multipliers: Record<string, number> = {
    'micro': 0.7,
    'economy-sedan': 1.0,
    'comfort-sedan': 1.3,
    'minivan-4pax': 1.3,
    'suv': 1.5,
    'minibus-7pax': 1.8,
    'minibus-10pax': 2.5,
    'minibus-13pax': 3.5,
    'minibus-16pax': 4.5,
    'minibus-19pax': 5.5,
    'luxury-sedan': 2.0,
    'luxury-suv': 2.5,
  }
  
  const multiplier = multipliers[vehicleTypeSlug] || 1.0
  return Math.round(basePrice * multiplier * 100) / 100
}

export interface UpdatePricingData {
  vehicle_type_id: string
  price: number
  is_active: boolean
}

export async function updateRoutePricing(
  routeId: string, 
  pricingUpdates: UpdatePricingData[]
) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Update or insert pricing for each vehicle type
    for (const update of pricingUpdates) {
      const { error } = await supabase
        .from('route_vehicle_type_pricing')
        .upsert({
          route_id: routeId,
          vehicle_type_id: update.vehicle_type_id,
          price: update.price,
          is_active: update.is_active,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'route_id,vehicle_type_id'
        })

      if (error) {
        console.error('Error updating pricing:', error)
        throw new Error(`Failed to update pricing for vehicle type ${update.vehicle_type_id}`)
      }
    }

    revalidatePath(`/admin/routes/${routeId}/pricing`)
    revalidatePath(`/admin/routes`)
    revalidatePath(`/search/route`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateRoutePricing:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update pricing' }
  }
}

export async function applyBulkPriceChange(
  routeId: string,
  changeType: 'percentage' | 'fixed',
  changeValue: number
) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Get current pricing
    const pricingData = await getRoutePricing(routeId)
    if (!pricingData) {
      throw new Error('Failed to fetch current pricing')
    }

    // Calculate new prices
    const updates = pricingData.pricing.map(p => {
      let newPrice: number
      if (changeType === 'percentage') {
        newPrice = p.price * (1 + changeValue / 100)
      } else {
        newPrice = p.price + changeValue
      }
      
      // Ensure price doesn't go below 0
      newPrice = Math.max(0, Math.round(newPrice * 100) / 100)
      
      return {
        vehicle_type_id: p.vehicle_type_id,
        price: newPrice,
        is_active: p.is_active
      }
    })

    // Apply updates
    return await updateRoutePricing(routeId, updates)
  } catch (error) {
    console.error('Error in applyBulkPriceChange:', error)
    return { error: error instanceof Error ? error.message : 'Failed to apply bulk price change' }
  }
}

export async function copyPricingFromRoute(
  targetRouteId: string,
  sourceRouteId: string
) {
  await requireAdmin()
  
  try {
    // Get source route pricing
    const sourcePricing = await getRoutePricing(sourceRouteId)
    if (!sourcePricing) {
      throw new Error('Failed to fetch source route pricing')
    }

    // Copy pricing to target route
    const updates = sourcePricing.pricing.map(p => ({
      vehicle_type_id: p.vehicle_type_id,
      price: p.price,
      is_active: p.is_active
    }))

    return await updateRoutePricing(targetRouteId, updates)
  } catch (error) {
    console.error('Error in copyPricingFromRoute:', error)
    return { error: error instanceof Error ? error.message : 'Failed to copy pricing' }
  }
}