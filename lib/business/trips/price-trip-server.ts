import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { bookingWallClockToUtc } from '@/lib/business/utils/timezone';
import { BUSINESS_AS_DIRECTED, BUSINESS_MAX_LEGS_HARD_LIMIT } from './constants';
import { quoteBusinessTrip, toCents } from './pricing';
import {
  businessLegFare,
  getBusinessHourlyPackages,
  getBusinessRouteDurationMinutes,
  loadBusinessTripLocations,
  lookupBusinessZoneBasePrice,
} from './pricing-server';
import { verifyBusinessTripAddons, type BusinessVerifiedAddon } from './addons-server';
import { businessTripRouteKey, verifyBusinessTripQuote } from './quote-hmac';
import type { BusinessTripCreationInput } from './schemas';
import type { BusinessTripSettings } from './settings';
import type { BusinessHourlyPackageRow, BusinessTripQuote } from './types';
import {
  validateBusinessHourlyStart,
  validateBusinessLegTiming,
  validateRoundTripRoute,
} from './validation';

/**
 * Re-derives every price of a business trip on the server and checks every rule, before any money
 * moves. Client prices are never used: the signed base price only proves which quote the business
 * saw, and a fare that changed since then is refused rather than silently charged.
 * SCOPE: Business module ONLY.
 */
export interface PricedBusinessLeg {
  from_location_id: string;
  to_location_id: string | null;
  from_name: string;
  to_name: string | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;
  base_price: number;
  discount_amount: number;
  total_price: number;
}

export interface PricedBusinessTrip {
  legs: PricedBusinessLeg[];
  quote: BusinessTripQuote;
  addons: BusinessVerifiedAddon[];
  addonsPerJourney: number;
  vehicle: { id: string; name: string; categoryName: string | null };
  hourly: BusinessHourlyPackageRow | null;
}

export type PriceTripResult = { ok: true; trip: PricedBusinessTrip } | { ok: false; status: number; error: string };

type Client = SupabaseClient<Database>;

const fail = (status: number, error: string): PriceTripResult => ({ ok: false, status, error });

interface DraftLeg {
  from: string;
  to: string | null;
  pickup_address: string;
  dropoff_address: string;
  date: string;
  time: string;
}

function draftLegs(body: BusinessTripCreationInput): DraftLeg[] {
  if (body.trip_type === 'hourly') {
    return [{
      from: body.hourly.from_location_id,
      to: null,
      pickup_address: body.hourly.pickup_address,
      dropoff_address: BUSINESS_AS_DIRECTED,
      date: body.hourly.date,
      time: body.hourly.time,
    }];
  }
  return body.legs.map((leg) => ({
    from: leg.from_location_id,
    to: leg.to_location_id,
    pickup_address: leg.pickup_address,
    dropoff_address: leg.dropoff_address,
    date: leg.date,
    time: leg.time,
  }));
}

export async function priceBusinessTrip(
  supabase: Client,
  body: BusinessTripCreationInput,
  settings: BusinessTripSettings,
  businessAccountId: string
): Promise<PriceTripResult> {
  const enabled = body.trip_type === 'round_trip' ? settings.round_trip_enabled
    : body.trip_type === 'multi_city' ? settings.multi_city_enabled
    : settings.hourly_enabled;
  if (!enabled) return fail(403, 'This trip type is not available right now.');

  const drafts = draftLegs(body);
  const hourlyPackage = body.trip_type === 'hourly' ? body.hourly.hourly_package : null;

  // Signature first: cheap, and proves which quote the business saw.
  const signature = verifyBusinessTripQuote({
    tripType: body.trip_type,
    businessAccountId,
    vehicleTypeId: body.vehicle_type_id,
    routeKey: businessTripRouteKey(drafts.map((d) => ({ from: d.from, to: d.to })), hourlyPackage),
    basePrice: body.base_price,
    signature: body.price_signature,
    timestamp: body.price_signature_timestamp,
    nonce: body.price_signature_nonce,
  });
  if (!signature.valid) {
    console.error('SECURITY ALERT: Business trip quote HMAC failed', { reason: signature.reason, businessAccountId });
    return fail(403, 'Price quote verification failed. Please choose the vehicle again.');
  }

  if (body.trip_type === 'round_trip') {
    const routeError = validateRoundTripRoute(drafts.map((d) => ({ fromId: d.from, toId: d.to ?? '' })));
    if (routeError) return fail(400, routeError);
  }

  const { data: vehicle } = await supabase
    .from('vehicle_types')
    .select('id, name, passenger_capacity, business_price_multiplier, price_multiplier, vehicle_categories!left(name)')
    .eq('id', body.vehicle_type_id)
    .eq('is_active', true)
    .maybeSingle();
  if (!vehicle) return fail(400, 'Vehicle type not found or inactive.');
  if (body.passenger_count > vehicle.passenger_capacity) {
    return fail(400, `This vehicle seats ${vehicle.passenger_capacity}; the booking is for ${body.passenger_count} guests.`);
  }

  const locations = await loadBusinessTripLocations(
    supabase,
    drafts.flatMap((d) => (d.to ? [d.from, d.to] : [d.from]))
  );

  const fares: number[] = [];
  const durations: Array<number | null> = [];
  let hourly: BusinessHourlyPackageRow | null = null;

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const label = body.trip_type === 'hourly' ? 'Pickup' : `Journey ${index + 1}`;
    const from = locations.get(draft.from);
    if (!from) return fail(400, `${label}: choose a valid pickup location.`);
    if (!from.allowPickup) return fail(400, `${label}: pickups are not available at ${from.name}.`);

    if (draft.to === null) {
      const packages = hourlyPackage ? await getBusinessHourlyPackages(supabase, hourlyPackage) : new Map();
      hourly = packages.get(vehicle.id) ?? null;
      if (!hourly) return fail(400, 'This vehicle does not offer the chosen package.');
      fares.push(hourly.price);
      durations.push(null);
      continue;
    }

    const to = locations.get(draft.to);
    if (!to) return fail(400, `${label}: choose a valid destination.`);
    if (!to.allowDropoff) return fail(400, `${label}: drop-offs are not available at ${to.name}.`);
    const base = await lookupBusinessZoneBasePrice(supabase, from.zoneId, to.zoneId);
    if (base === null) return fail(400, `No service available for ${from.name} to ${to.name}.`);
    fares.push(businessLegFare(base, vehicle));
    durations.push(await getBusinessRouteDurationMinutes(supabase, from.id, to.id));
  }

  const timingError = body.trip_type === 'hourly'
    ? validateBusinessHourlyStart(drafts[0].date, drafts[0].time, { minNoticeHours: settings.hourly_min_notice_hours })
    : validateBusinessLegTiming(
        drafts.map((d, i) => ({ fromId: d.from, toId: d.to ?? '', date: d.date, time: d.time, durationMinutes: durations[i] })),
        {
          bufferMinutes: settings.leg_buffer_minutes,
          maxLegs: body.trip_type === 'round_trip' ? 2 : Math.min(settings.multi_city_max_legs, BUSINESS_MAX_LEGS_HARD_LIMIT),
          roundTrip: body.trip_type === 'round_trip',
        }
      );
  if (timingError) return fail(400, timingError);

  const discountPercent = body.trip_type === 'round_trip' ? settings.round_trip_discount_percent : 0;
  const fareQuote = quoteBusinessTrip(fares.map((baseFare) => ({ baseFare })), discountPercent);
  if (toCents(fareQuote.total) !== toCents(body.base_price)) {
    return fail(409, 'Prices changed since you chose the vehicle. Please choose it again.');
  }

  const addons = await verifyBusinessTripAddons(
    supabase,
    (body.selected_addons ?? []).map((a) => ({ addon_id: a.addon_id, quantity: a.quantity, child_ages: a.child_ages })),
    { children: body.children, infants: body.infants }
  );
  if (!addons.ok) return fail(400, addons.error);

  const quote = quoteBusinessTrip(fares.map((baseFare) => ({ baseFare, addons: addons.perJourney })), discountPercent);
  const category = Array.isArray(vehicle.vehicle_categories) ? vehicle.vehicle_categories[0] : vehicle.vehicle_categories;

  const legs: PricedBusinessLeg[] = drafts.map((draft, index) => ({
    from_location_id: draft.from,
    to_location_id: draft.to,
    from_name: locations.get(draft.from)?.name ?? '',
    to_name: draft.to ? locations.get(draft.to)?.name ?? null : null,
    pickup_address: draft.pickup_address,
    dropoff_address: draft.dropoff_address,
    pickup_datetime: bookingWallClockToUtc(draft.date, draft.time).toISOString(),
    base_price: quote.legs[index].base,
    discount_amount: quote.legs[index].discount,
    total_price: quote.legs[index].total,
  }));

  return {
    ok: true,
    trip: {
      legs,
      quote,
      addons: addons.addons,
      addonsPerJourney: addons.perJourney,
      vehicle: { id: vehicle.id, name: vehicle.name, categoryName: category?.name ?? null },
      hourly,
    },
  };
}
