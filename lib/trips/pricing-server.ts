import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { isHourlyPackage, type HourlyPackage, type HourlyPackageRow } from './types'
import { roundMoney } from './pricing'

type Client = SupabaseClient<Database>

/**
 * Zone-to-zone base price between two locations, before the vehicle type
 * multiplier. Null when either location has no zone or the pair has no active
 * price: callers decide whether that is a fallback (one way, historical
 * behaviour) or "not available" (every new trip type).
 */
export async function lookupZoneBasePrice(
  supabase: Client,
  fromLocationId: string,
  toLocationId: string
): Promise<number | null> {
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, zone_id')
    .in('id', [fromLocationId, toLocationId])

  if (error || !locations) {
    if (error) console.error('[trips] zone lookup failed:', error.message)
    return null
  }

  const fromZoneId = locations.find((location) => location.id === fromLocationId)?.zone_id
  const toZoneId = locations.find((location) => location.id === toLocationId)?.zone_id
  if (!fromZoneId || !toZoneId) return null

  const { data: zonePricing, error: pricingError } = await supabase
    .from('zone_pricing')
    .select('base_price')
    .eq('from_zone_id', fromZoneId)
    .eq('to_zone_id', toZoneId)
    .eq('is_active', true)
    .maybeSingle()

  if (pricingError) {
    console.error('[trips] zone pricing lookup failed:', pricingError.message)
    return null
  }

  return zonePricing ? Number(zonePricing.base_price) : null
}

/** Strict leg fare for new trip types: zone price times multiplier, or null. */
export async function quoteLegFare(
  supabase: Client,
  fromLocationId: string,
  toLocationId: string,
  priceMultiplier: number | null
): Promise<number | null> {
  const base = await lookupZoneBasePrice(supabase, fromLocationId, toLocationId)
  return base === null ? null : roundMoney(base * (priceMultiplier || 1))
}

function toPackageRow(row: {
  package: string
  hours: number
  included_km: number
  price: number
  extra_hour_price: number
  currency: string
}): HourlyPackageRow | null {
  if (!isHourlyPackage(row.package)) return null
  return {
    package: row.package,
    hours: Number(row.hours),
    includedKm: row.included_km,
    price: Number(row.price),
    extraHourPrice: Number(row.extra_hour_price),
    currency: row.currency,
  }
}

/** Active hourly packages for one vehicle type. */
export async function getHourlyPackage(
  supabase: Client,
  vehicleTypeId: string,
  hourlyPackage: HourlyPackage
): Promise<HourlyPackageRow | null> {
  const { data, error } = await supabase
    .from('vehicle_type_hourly_packages')
    .select('package, hours, included_km, price, extra_hour_price, currency')
    .eq('vehicle_type_id', vehicleTypeId)
    .eq('package', hourlyPackage)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[trips] hourly package lookup failed:', error.message)
    return null
  }
  return data ? toPackageRow(data) : null
}

/** Active packages of one kind, keyed by vehicle type id. */
export async function getHourlyPackagesByVehicleType(
  supabase: Client,
  hourlyPackage: HourlyPackage
): Promise<Map<string, HourlyPackageRow>> {
  const { data, error } = await supabase
    .from('vehicle_type_hourly_packages')
    .select('vehicle_type_id, package, hours, included_km, price, extra_hour_price, currency')
    .eq('package', hourlyPackage)
    .eq('is_active', true)

  const byVehicleType = new Map<string, HourlyPackageRow>()
  if (error) {
    console.error('[trips] hourly packages lookup failed:', error.message)
    return byVehicleType
  }

  for (const row of data ?? []) {
    const parsed = toPackageRow(row)
    if (parsed) byVehicleType.set(row.vehicle_type_id, parsed)
  }
  return byVehicleType
}
