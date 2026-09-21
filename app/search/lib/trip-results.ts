import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../results/actions'

/**
 * Shared building blocks for the trip-type result pages (hourly, round trip,
 * multi-city). The one-way search keeps its own code in `results/actions.ts`,
 * untouched, so these pages cannot regress it.
 */

export interface VehicleTypeRow {
  id: string
  name: string
  slug: string
  description: string | null
  passengerCapacity: number
  luggageCapacity: number
  categoryId: string
  categoryName: string
  categorySlug: string
  image: string | undefined
  priceMultiplier: number
}

/** Active vehicle types that seat the party, smallest first (same filter as the transfer search). */
export async function getVehicleTypesForParty(passengers: number): Promise<VehicleTypeRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
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
      vehicle_categories!left(id, name, slug)
    `)
    .eq('is_active', true)
    .gte('passenger_capacity', passengers)
    .order('passenger_capacity', { ascending: true })

  if (error || !data) {
    console.error('[trip-results] vehicle types lookup failed:', error?.message)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    passengerCapacity: row.passenger_capacity,
    luggageCapacity: row.luggage_capacity ?? 0,
    categoryId: row.category_id || '',
    categoryName: row.vehicle_categories?.name || 'Standard',
    categorySlug: row.vehicle_categories?.slug || 'standard',
    image: row.image_url || undefined,
    priceMultiplier: row.price_multiplier || 1,
  }))
}

/** A VehicleTypeResult for a trip-type card. `price` is what the "From" figure shows. */
export function toVehicleTypeResult(
  row: VehicleTypeRow,
  price: number,
  extras: Pick<VehicleTypeResult, 'tripPricing' | 'unavailableReason'> & { available: boolean }
): VehicleTypeResult {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.categoryName,
    categoryId: row.categoryId,
    categorySlug: row.categorySlug,
    capacity: row.passengerCapacity,
    luggageCapacity: row.luggageCapacity,
    description: row.description || '',
    price,
    currency: 'AED',
    // Aggregator model, as in the transfer search: any vendor may take the job.
    availableVehicles: extras.available ? 10 : 0,
    vendorCount: extras.available ? 5 : 0,
    features: [],
    image: row.image,
    tripPricing: extras.tripPricing,
    unavailableReason: extras.unavailableReason,
  }
}

/** Groups by category, cheapest bookable category first (unbookable ones sort last). */
export function groupByCategory(vehicleTypes: VehicleTypeResult[]): VehicleTypesByCategory[] {
  const categories = new Map<string, VehicleTypesByCategory>()

  for (const vehicleType of vehicleTypes) {
    const existing = categories.get(vehicleType.categoryId) ?? {
      categoryId: vehicleType.categoryId,
      categoryName: vehicleType.category,
      categorySlug: vehicleType.categorySlug,
      vehicleTypes: [],
      minPrice: Number.MAX_VALUE,
    }
    const bookable = vehicleType.availableVehicles > 0
    categories.set(vehicleType.categoryId, {
      ...existing,
      vehicleTypes: [...existing.vehicleTypes, vehicleType],
      minPrice: bookable ? Math.min(existing.minPrice, vehicleType.price) : existing.minPrice,
    })
  }

  return Array.from(categories.values()).sort((a, b) => a.minPrice - b.minPrice)
}

/** Lowest price among bookable vehicles, or null when none can be booked. */
export function lowestBookablePrice(vehicleTypes: VehicleTypeResult[]): number | null {
  const prices = vehicleTypes.filter((vt) => vt.availableVehicles > 0).map((vt) => vt.price)
  return prices.length > 0 ? Math.min(...prices) : null
}
