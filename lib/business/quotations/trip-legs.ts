/**
 * Pure helpers that let a quotation trip use the booking wizard's trip-type pieces.
 *
 * The wizard holds a journey as an operating-timezone date + time; a quotation stores an ISO
 * instant. These convert between the two, and decide what a trip looks like when its type
 * changes. No React, no Supabase, so they unit-test under the node jest config.
 *
 * SCOPE: Business module ONLY
 */

import { bookingLocalInputToUtc, bookingUtcToLocalInput } from '@/lib/business/utils/timezone';
import { emptyBusinessLeg, initialLegsFor } from '@/lib/business/trips/draft';
import type { BusinessTripLegInput, BusinessTripType } from '@/lib/business/trips/types';
import type { QuotationTripDraft, QuotationTripLegDraft } from './types';

export function tripTypeOf(trip: Pick<QuotationTripDraft, 'trip_type'>): BusinessTripType {
  return trip.trip_type ?? 'one_way';
}

export function isGroupedTrip(trip: Pick<QuotationTripDraft, 'trip_type'>): boolean {
  const type = tripTypeOf(trip);
  return type === 'round_trip' || type === 'multi_city';
}

/** Journeys the trip drives: add-ons are charged once per journey, exactly as on a booking. */
export function journeyCount(trip: Pick<QuotationTripDraft, 'trip_type' | 'legs'>): number {
  return isGroupedTrip(trip) ? Math.max(trip.legs?.length ?? 0, 1) : 1;
}

function splitInstant(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const [date = '', time = ''] = bookingUtcToLocalInput(iso).split('T');
  return { date, time };
}

export function joinInstant(date: string, time: string): string | null {
  if (!date || !time) return null;
  return bookingLocalInputToUtc(`${date}T${time}`).toISOString();
}

export function toWizardLeg(leg: QuotationTripLegDraft): BusinessTripLegInput {
  return {
    from_location_id: leg.from_location_id,
    to_location_id: leg.to_location_id,
    from_location_name: leg.from_location_name ?? '',
    to_location_name: leg.to_location_name ?? '',
    pickup_address: leg.pickup_address,
    dropoff_address: leg.dropoff_address,
    ...splitInstant(leg.pickup_datetime),
  };
}

export function fromWizardLeg(leg: BusinessTripLegInput): QuotationTripLegDraft {
  return {
    from_location_id: leg.from_location_id,
    to_location_id: leg.to_location_id,
    from_location_name: leg.from_location_name || undefined,
    to_location_name: leg.to_location_name || undefined,
    pickup_address: leg.pickup_address,
    dropoff_address: leg.dropoff_address,
    pickup_datetime: joinInstant(leg.date, leg.time),
  };
}

/** The trip's own route columns as a journey: leg 0 of a multi-journey trip, or the one-way route. */
export function firstLegOf(trip: QuotationTripDraft): QuotationTripLegDraft {
  return {
    from_location_id: trip.from_location_id,
    to_location_id: trip.to_location_id,
    from_location_name: trip.from_location_name,
    to_location_name: trip.to_location_name,
    pickup_address: trip.pickup_address,
    dropoff_address: trip.dropoff_address,
    pickup_datetime: trip.pickup_datetime,
  };
}

/** The trip's route columns mirrored from its first journey. */
export function routeFieldsFrom(leg: QuotationTripLegDraft): Partial<QuotationTripDraft> {
  return {
    from_location_id: leg.from_location_id,
    to_location_id: leg.to_location_id,
    from_location_name: leg.from_location_name,
    to_location_name: leg.to_location_name,
    pickup_address: leg.pickup_address,
    dropoff_address: leg.dropoff_address,
    pickup_datetime: leg.pickup_datetime,
  };
}

/** Every price on a trip is for one type and route; switching type starts the vehicle over. */
const CLEARED_VEHICLE: Partial<QuotationTripDraft> = {
  vehicle_type_id: '',
  vehicle_type_name: undefined,
  vehicle_type_image: null,
  vehicle_options: [],
  net_base_price_aed: 0,
};

/**
 * The patch that turns `trip` into `type`, keeping whatever route was already entered. Reuses the
 * wizard's initialLegsFor, so a round trip gets its return mirrored the same way.
 */
export function switchTripType(trip: QuotationTripDraft, type: BusinessTripType): Partial<QuotationTripDraft> {
  if (type === tripTypeOf(trip)) return {};

  // An hourly hire has no destination; never carry its placeholder into a real one.
  const source = tripTypeOf(trip) === 'hourly' ? { ...firstLegOf(trip), to_location_id: '', dropoff_address: '' } : firstLegOf(trip);
  const current = isGroupedTrip(trip) && trip.legs?.length ? trip.legs.map(toWizardLeg) : [toWizardLeg(source)];
  const base = { ...CLEARED_VEHICLE, trip_type: type, hourly_package: null, duration_hours: null, included_km: null };

  if (type === 'one_way') {
    return { ...base, legs: [], ...routeFieldsFrom(fromWizardLeg(current[0] ?? emptyBusinessLeg())) };
  }
  if (type === 'hourly') {
    const first = fromWizardLeg(current[0] ?? emptyBusinessLeg());
    return {
      ...base,
      legs: [],
      hourly_package: 'half_day',
      ...routeFieldsFrom({ ...first, to_location_id: '', to_location_name: undefined, dropoff_address: '' }),
    };
  }
  const legs = initialLegsFor(type, current).map(fromWizardLeg);
  return { ...base, legs, ...routeFieldsFrom(legs[0]) };
}

/** True when the route is complete enough to price vehicles for it. */
export function tripRouteReady(trip: QuotationTripDraft): boolean {
  const type = tripTypeOf(trip);
  if (type === 'hourly') return Boolean(trip.from_location_id && trip.pickup_datetime && trip.hourly_package);
  if (type === 'one_way') {
    return Boolean(trip.from_location_id && trip.to_location_id) && trip.from_location_id !== trip.to_location_id;
  }
  const legs = trip.legs ?? [];
  return (
    legs.length >= 2 &&
    legs.every((l) => l.from_location_id && l.to_location_id && l.from_location_id !== l.to_location_id && l.pickup_datetime)
  );
}

/** Addresses filled in, per type. */
export function tripAddressesReady(trip: QuotationTripDraft): boolean {
  const ok = (value: string | null | undefined) => (value ?? '').trim().length >= 5;
  const type = tripTypeOf(trip);
  if (type === 'hourly') return ok(trip.pickup_address);
  if (type === 'one_way') return ok(trip.pickup_address) && ok(trip.dropoff_address);
  return (trip.legs ?? []).every((l) => ok(l.pickup_address) && ok(l.dropoff_address));
}

/** Shift a duplicated trip a day later, every journey together. */
export function shiftTripByDays(trip: QuotationTripDraft, days: number): Partial<QuotationTripDraft> {
  // Same wall-clock time on a later calendar day in the operating timezone, not "+24 hours".
  const shift = (iso: string | null): string | null => {
    if (!iso) return null;
    const { date, time } = splitInstant(iso);
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return joinInstant(next.toISOString().slice(0, 10), time);
  };
  return {
    pickup_datetime: shift(trip.pickup_datetime),
    ...(trip.legs?.length ? { legs: trip.legs.map((l) => ({ ...l, pickup_datetime: shift(l.pickup_datetime) })) } : {}),
  };
}
