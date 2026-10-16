import 'server-only';

/**
 * Server-side checks a quotation's trips need before they are saved, beyond the Zod shape:
 * the admin's trip-type switches, and the hourly package of every vehicle quoted on an hourly
 * trip. Reuses the business booking helpers so a quotation follows exactly the rules a booking
 * does.
 *
 * SCOPE: Business module ONLY
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { getBusinessTripSettings } from '@/lib/business/trips/settings-server';
import { getBusinessHourlyPackages } from '@/lib/business/trips/pricing-server';
import { BUSINESS_MAX_LEGS_HARD_LIMIT, BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import type { BusinessHourlyPackage, BusinessHourlyPackageRow, BusinessTripType } from '@/lib/business/trips/types';
import type { QuotationTripInput } from './schema';

/** Package figures snapshotted onto an hourly trip so the quote and PDF show what was priced. */
export interface QuotationHourlySnapshot {
  hourly_package: BusinessHourlyPackage;
  duration_hours: number;
  included_km: number | null;
  extra_hour_price: number | null;
}

export type PreparedQuotationTrip = QuotationTripInput & { hourly: QuotationHourlySnapshot | null };

/** Null when the trip type is allowed by the admin settings, else the reason it is not. */
export function tripTypeSettingsError(
  type: BusinessTripType,
  legCount: number,
  settings: BusinessTripSettings
): string | null {
  const label = BUSINESS_TRIP_TYPE_LABELS[type];
  if (type === 'round_trip' && !settings.round_trip_enabled) return `${label} trips are switched off. Change the trip type.`;
  if (type === 'multi_city' && !settings.multi_city_enabled) return `${label} trips are switched off. Change the trip type.`;
  if (type === 'hourly' && !settings.hourly_enabled) return 'Hourly hire is switched off. Change the trip type.';
  if (type === 'multi_city') {
    const max = Math.min(settings.multi_city_max_legs, BUSINESS_MAX_LEGS_HARD_LIMIT);
    if (legCount > max) return `A multi-city trip can have at most ${max} journeys.`;
  }
  return null;
}

function hourlySnapshot(
  trip: QuotationTripInput,
  packages: Map<string, BusinessHourlyPackageRow>
): QuotationHourlySnapshot | string {
  const vehicleIds = [trip.vehicle_type_id, ...trip.vehicle_options.map((o) => o.vehicle_type_id)];
  if (vehicleIds.some((id) => !packages.has(id))) {
    return 'A vehicle on an hourly trip does not offer that package. Pick the vehicle again.';
  }
  const pkg = packages.get(trip.vehicle_type_id) as BusinessHourlyPackageRow;
  return {
    hourly_package: pkg.package,
    duration_hours: pkg.hours,
    included_km: pkg.includedKm,
    extra_hour_price: pkg.extraHourPrice,
  };
}

/**
 * `savedTypes` maps an already-saved trip id to its stored type. A trip that keeps its saved type
 * is not refused when the admin later switches that type off: the business can still edit the
 * rest of the quotation, and conversion refuses the trip instead, with the same message.
 */
export async function prepareQuotationTrips(
  supabase: SupabaseClient<Database>,
  trips: QuotationTripInput[],
  savedTypes: ReadonlyMap<string, string> = new Map()
): Promise<{ error: string } | { trips: PreparedQuotationTrip[] }> {
  if (trips.every((t) => t.trip_type === 'one_way')) {
    return { trips: trips.map((t) => ({ ...t, hourly: null })) };
  }

  const settings = await getBusinessTripSettings(supabase);
  const packageCache = new Map<BusinessHourlyPackage, Map<string, BusinessHourlyPackageRow>>();
  const prepared: PreparedQuotationTrip[] = [];

  for (let index = 0; index < trips.length; index += 1) {
    const trip = trips[index];
    const unchangedType = Boolean(trip.id) && savedTypes.get(trip.id as string) === trip.trip_type;
    const settingsError = unchangedType ? null : tripTypeSettingsError(trip.trip_type, trip.legs.length, settings);
    if (settingsError) return { error: `Trip ${index + 1}: ${settingsError}` };

    if (trip.trip_type !== 'hourly' || !trip.hourly_package) {
      prepared.push({ ...trip, hourly: null });
      continue;
    }

    const packages =
      packageCache.get(trip.hourly_package) ?? (await getBusinessHourlyPackages(supabase, trip.hourly_package));
    packageCache.set(trip.hourly_package, packages);
    const snapshot = hourlySnapshot(trip, packages);
    if (typeof snapshot === 'string') return { error: `Trip ${index + 1}: ${snapshot}` };
    prepared.push({ ...trip, hourly: snapshot });
  }

  return { trips: prepared };
}
