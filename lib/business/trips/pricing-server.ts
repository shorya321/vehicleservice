import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { roundMoney } from './pricing';
import { isBusinessHourlyPackage, type BusinessHourlyPackage, type BusinessHourlyPackageRow } from './types';

/**
 * Database lookups behind business trip prices.
 * SCOPE: Business module ONLY. Business twin of lib/trips/pricing-server.ts and
 * lib/trips/locations-server.ts. Do not de-duplicate.
 *
 * Fares use the same formula as the business one-way quote (actions.ts and
 * lib/business/price-calculation.ts): zone base price x the vehicle's business multiplier.
 */
type Client = SupabaseClient<Database>;

export interface BusinessTripLocation {
  id: string;
  name: string;
  zoneId: string | null;
  allowPickup: boolean;
  allowDropoff: boolean;
}

/** Active locations by id. Missing or inactive ids are simply absent from the map. */
export async function loadBusinessTripLocations(
  supabase: Client,
  ids: string[]
): Promise<Map<string, BusinessTripLocation>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const byId = new Map<string, BusinessTripLocation>();
  if (unique.length === 0) return byId;

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, zone_id, allow_pickup, allow_dropoff')
    .in('id', unique)
    .eq('is_active', true);

  if (error) {
    console.error('[business trips] location lookup failed:', error.message);
    return byId;
  }

  for (const row of data ?? []) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      zoneId: row.zone_id,
      // Null means "not restricted", matching how the location search treats it.
      allowPickup: row.allow_pickup !== false,
      allowDropoff: row.allow_dropoff !== false,
    });
  }
  return byId;
}

/** Zone-to-zone base price, before the vehicle multiplier. Null when the pair has no active price. */
export async function lookupBusinessZoneBasePrice(
  supabase: Client,
  fromZoneId: string | null,
  toZoneId: string | null
): Promise<number | null> {
  if (!fromZoneId || !toZoneId) return null;
  const { data, error } = await supabase
    .from('zone_pricing')
    .select('base_price')
    .eq('from_zone_id', fromZoneId)
    .eq('to_zone_id', toZoneId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[business trips] zone pricing lookup failed:', error.message);
    return null;
  }
  return data ? Number(data.base_price) : null;
}

export interface BusinessVehicleMultiplier {
  business_price_multiplier: number | null;
  price_multiplier: number | null;
}

export function businessVehicleMultiplier(vehicle: BusinessVehicleMultiplier): number {
  return Number(vehicle.business_price_multiplier) || Number(vehicle.price_multiplier) || 1;
}

/** One journey's fare for one vehicle, rounded to the cent. */
export function businessLegFare(zoneBasePrice: number, vehicle: BusinessVehicleMultiplier): number {
  return roundMoney(zoneBasePrice * businessVehicleMultiplier(vehicle));
}

/** Estimated drive minutes between two locations, or null if no route is recorded. */
export async function getBusinessRouteDurationMinutes(
  supabase: Client,
  fromLocationId: string,
  toLocationId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('estimated_duration_minutes')
    .eq('origin_location_id', fromLocationId)
    .eq('destination_location_id', toLocationId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[business trips] route duration lookup failed:', error.message);
    return null;
  }
  return data?.estimated_duration_minutes ?? null;
}

/** Active hourly packages of one kind, keyed by vehicle type id. Price used as is (no multiplier). */
export async function getBusinessHourlyPackages(
  supabase: Client,
  hourlyPackage: BusinessHourlyPackage
): Promise<Map<string, BusinessHourlyPackageRow>> {
  const byVehicleType = new Map<string, BusinessHourlyPackageRow>();
  const { data, error } = await supabase
    .from('vehicle_type_hourly_packages')
    .select('vehicle_type_id, package, hours, included_km, price, extra_hour_price')
    .eq('package', hourlyPackage)
    .eq('is_active', true);

  if (error) {
    console.error('[business trips] hourly packages lookup failed:', error.message);
    return byVehicleType;
  }

  for (const row of data ?? []) {
    if (!isBusinessHourlyPackage(row.package)) continue;
    byVehicleType.set(row.vehicle_type_id, {
      package: row.package,
      hours: Number(row.hours),
      includedKm: row.included_km,
      price: Number(row.price),
      extraHourPrice: Number(row.extra_hour_price),
    });
  }
  return byVehicleType;
}
