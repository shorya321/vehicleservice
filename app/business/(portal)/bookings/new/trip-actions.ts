'use server';

/**
 * Vehicle quotes for round trip, multi-city and hourly business bookings.
 * SCOPE: Business module ONLY. One-way quotes stay in ./actions.ts, untouched.
 *
 * No exported types here: a 'use server' module may only export async functions. Shapes live in
 * lib/business/trips/types.ts and ./actions.ts.
 */

import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { getBusinessTripSettings } from '@/lib/business/trips/settings-server';
import {
  businessLegFare,
  getBusinessRouteDurationMinutes,
  getBusinessHourlyPackages,
  loadBusinessTripLocations,
  lookupBusinessZoneBasePrice,
} from '@/lib/business/trips/pricing-server';
import { quoteBusinessTrip } from '@/lib/business/trips/pricing';
import { businessTripRouteKey, signBusinessTripQuote } from '@/lib/business/trips/quote-hmac';
import { BUSINESS_MAX_LEGS_HARD_LIMIT } from '@/lib/business/trips/constants';
import { validateBusinessHourlyStart, validateBusinessLegTiming } from '@/lib/business/trips/validation';
import {
  isBusinessHourlyPackage,
  type BusinessHourlyPackage,
  type BusinessTripVehicleQuote,
} from '@/lib/business/trips/types';
import type { VehicleTypeResult, VehicleTypesByCategory } from './actions';

interface TripVehiclesResponse {
  vehicleTypes: VehicleTypeResult[];
  vehicleTypesByCategory: VehicleTypesByCategory[];
  quotes: Record<string, BusinessTripVehicleQuote>;
  error?: string;
}

const EMPTY: Omit<TripVehiclesResponse, 'error'> = { vehicleTypes: [], vehicleTypesByCategory: [], quotes: {} };

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function resolveAccountId(supabase: Supabase): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const member = await getBusinessMember(supabase, user.id);
  return member?.businessAccountId ?? null;
}

async function loadVehicleTypes(supabase: Supabase, passengers: number) {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select(`
      id, name, slug, passenger_capacity, luggage_capacity, description, category_id, image_url,
      price_multiplier, business_price_multiplier,
      vehicle_categories!left(id, name, slug, sort_order)
    `)
    .eq('is_active', true)
    .gte('passenger_capacity', Math.max(passengers, 1))
    .order('passenger_capacity', { ascending: true });

  if (error) console.error('[business trips] vehicle types lookup failed:', error.message);
  return data ?? [];
}

type VehicleRow = Awaited<ReturnType<typeof loadVehicleTypes>>[number];

function toResult(
  vt: VehicleRow,
  price: number,
  caption: string,
  signed: { signature: string; timestamp: number; nonce: string }
): VehicleTypeResult {
  const category = Array.isArray(vt.vehicle_categories) ? vt.vehicle_categories[0] : vt.vehicle_categories;
  return {
    id: vt.id,
    name: vt.name,
    slug: vt.slug,
    category: category?.name || 'Standard',
    categoryId: vt.category_id || '',
    categorySlug: category?.slug || 'standard',
    capacity: vt.passenger_capacity,
    luggageCapacity: vt.luggage_capacity || 0,
    description: vt.description || '',
    price,
    currency: 'AED',
    availableVehicles: 10,
    vendorCount: 5,
    features: [],
    image: vt.image_url || undefined,
    priceSignature: signed.signature,
    priceSignatureTimestamp: signed.timestamp,
    priceSignatureNonce: signed.nonce,
    priceCaption: caption,
  };
}

function byCategory(vehicleTypes: VehicleTypeResult[]): VehicleTypesByCategory[] {
  const categories = new Map<string, VehicleTypesByCategory>();
  for (const vt of vehicleTypes) {
    const entry = categories.get(vt.categoryId) ?? {
      categoryId: vt.categoryId,
      categoryName: vt.category,
      categorySlug: vt.categorySlug,
      vehicleTypes: [],
      minPrice: Number.MAX_VALUE,
    };
    entry.vehicleTypes.push(vt);
    entry.minPrice = Math.min(entry.minPrice, vt.price);
    categories.set(vt.categoryId, entry);
  }
  return Array.from(categories.values()).sort((a, b) => a.minPrice - b.minPrice);
}

/**
 * Vehicles that can drive every journey of a round trip or multi-city trip, each priced for the
 * whole trip. A vehicle is offered only when every journey has an active zone price.
 */
export async function getBusinessTripVehicles(input: {
  tripType: 'round_trip' | 'multi_city';
  /** Date `yyyy-MM-dd` and time `HH:mm`, operating timezone. */
  legs: Array<{ fromLocationId: string; toLocationId: string; date: string; time: string }>;
  passengers: number;
}): Promise<TripVehiclesResponse> {
  try {
    const supabase = await createClient();
    const accountId = await resolveAccountId(supabase);
    if (!accountId) return { ...EMPTY, error: 'Your session has expired. Please sign in again.' };

    const settings = await getBusinessTripSettings(supabase);
    const enabled = input.tripType === 'round_trip' ? settings.round_trip_enabled : settings.multi_city_enabled;
    if (!enabled) return { ...EMPTY, error: 'This trip type is not available right now.' };

    const maxLegs = input.tripType === 'round_trip' ? 2 : Math.min(settings.multi_city_max_legs, BUSINESS_MAX_LEGS_HARD_LIMIT);
    if (input.legs.length < 2 || input.legs.length > maxLegs) {
      return { ...EMPTY, error: `A trip needs between 2 and ${maxLegs} journeys.` };
    }

    const locations = await loadBusinessTripLocations(
      supabase,
      input.legs.flatMap((leg) => [leg.fromLocationId, leg.toLocationId])
    );

    const zoneFares: number[] = [];
    const durations: Array<number | null> = [];
    for (let index = 0; index < input.legs.length; index += 1) {
      const leg = input.legs[index];
      const from = locations.get(leg.fromLocationId);
      const to = locations.get(leg.toLocationId);
      const label = `Journey ${index + 1}`;
      if (!from || !to) return { ...EMPTY, error: `${label}: choose valid locations.` };
      if (from.id === to.id) return { ...EMPTY, error: `${label}: pickup and destination must differ.` };
      if (!from.allowPickup) return { ...EMPTY, error: `${label}: pickups are not available at ${from.name}.` };
      if (!to.allowDropoff) return { ...EMPTY, error: `${label}: drop-offs are not available at ${to.name}.` };

      const base = await lookupBusinessZoneBasePrice(supabase, from.zoneId, to.zoneId);
      if (base === null) {
        return { ...EMPTY, error: `No service available for ${from.name} to ${to.name}.` };
      }
      zoneFares.push(base);
      durations.push(await getBusinessRouteDurationMinutes(supabase, from.id, to.id));
    }

    // The real drive times are known here, so a schedule that is too tight fails on the Route
    // step rather than after the business has filled in every detail. The create route checks again.
    const timingError = validateBusinessLegTiming(
      input.legs.map((leg, index) => ({
        fromId: leg.fromLocationId,
        toId: leg.toLocationId,
        date: leg.date,
        time: leg.time,
        durationMinutes: durations[index],
      })),
      { bufferMinutes: settings.leg_buffer_minutes, maxLegs, roundTrip: input.tripType === 'round_trip' }
    );
    if (timingError) return { ...EMPTY, error: timingError };

    const discountPercent = input.tripType === 'round_trip' ? settings.round_trip_discount_percent : 0;
    const routeKey = businessTripRouteKey(input.legs.map((leg) => ({ from: leg.fromLocationId, to: leg.toLocationId })));
    const caption = `for ${input.legs.length} journeys${discountPercent > 0 ? `, ${discountPercent}% off` : ''}`;

    const quotes: Record<string, BusinessTripVehicleQuote> = {};
    const vehicleTypes = (await loadVehicleTypes(supabase, input.passengers)).map((vt) => {
      const legFares = zoneFares.map((base) => businessLegFare(base, vt));
      const quote = quoteBusinessTrip(legFares.map((baseFare) => ({ baseFare })), discountPercent);
      quotes[vt.id] = {
        legFares,
        subtotal: quote.subtotal,
        discountPercent: quote.discountPercent,
        discount: quote.discount,
        total: quote.total,
      };
      const signed = signBusinessTripQuote({
        tripType: input.tripType,
        businessAccountId: accountId,
        vehicleTypeId: vt.id,
        routeKey,
        basePrice: quote.total,
      });
      return toResult(vt, quote.total, caption, signed);
    });

    return { vehicleTypes, vehicleTypesByCategory: byCategory(vehicleTypes), quotes };
  } catch (error) {
    console.error('[business trips] trip vehicle quote failed:', error);
    return { ...EMPTY, error: 'Failed to load available vehicles. Please try again.' };
  }
}

/** Vehicles offering the chosen hourly package, at the package price. */
export async function getBusinessHourlyVehicles(input: {
  fromLocationId: string;
  hourlyPackage: BusinessHourlyPackage;
  passengers: number;
  date: string;
  time: string;
}): Promise<TripVehiclesResponse> {
  try {
    if (!isBusinessHourlyPackage(input.hourlyPackage)) return { ...EMPTY, error: 'Choose a package.' };

    const supabase = await createClient();
    const accountId = await resolveAccountId(supabase);
    if (!accountId) return { ...EMPTY, error: 'Your session has expired. Please sign in again.' };

    const settings = await getBusinessTripSettings(supabase);
    if (!settings.hourly_enabled) return { ...EMPTY, error: 'Hourly hire is not available right now.' };
    const noticeError = validateBusinessHourlyStart(input.date, input.time, {
      minNoticeHours: settings.hourly_min_notice_hours,
    });
    if (noticeError) return { ...EMPTY, error: noticeError };

    const from = (await loadBusinessTripLocations(supabase, [input.fromLocationId])).get(input.fromLocationId);
    if (!from) return { ...EMPTY, error: 'Choose a valid pickup location.' };
    if (!from.allowPickup) return { ...EMPTY, error: `Pickups are not available at ${from.name}.` };

    const packages = await getBusinessHourlyPackages(supabase, input.hourlyPackage);
    const routeKey = businessTripRouteKey([{ from: input.fromLocationId }], input.hourlyPackage);

    const quotes: Record<string, BusinessTripVehicleQuote> = {};
    const vehicleTypes: VehicleTypeResult[] = [];
    for (const vt of await loadVehicleTypes(supabase, input.passengers)) {
      const pkg = packages.get(vt.id);
      if (!pkg) continue;
      quotes[vt.id] = {
        legFares: [pkg.price],
        subtotal: pkg.price,
        discountPercent: 0,
        discount: 0,
        total: pkg.price,
        hourly: { package: pkg.package, hours: pkg.hours, includedKm: pkg.includedKm, extraHourPrice: pkg.extraHourPrice },
      };
      const signed = signBusinessTripQuote({
        tripType: 'hourly',
        businessAccountId: accountId,
        vehicleTypeId: vt.id,
        routeKey,
        basePrice: pkg.price,
      });
      const caption = `${pkg.hours} h${pkg.includedKm ? ` · ${pkg.includedKm} km included` : ''}`;
      vehicleTypes.push(toResult(vt, pkg.price, caption, signed));
    }

    if (vehicleTypes.length === 0) {
      return { ...EMPTY, error: 'No vehicles offer this package for your group size.' };
    }
    return { vehicleTypes, vehicleTypesByCategory: byCategory(vehicleTypes), quotes };
  } catch (error) {
    console.error('[business trips] hourly vehicle quote failed:', error);
    return { ...EMPTY, error: 'Failed to load available vehicles. Please try again.' };
  }
}
