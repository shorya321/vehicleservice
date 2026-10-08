/**
 * The wizard's working copy of a trip, and the client-side check run before vehicles are fetched.
 * SCOPE: Business module ONLY.
 *
 * The server repeats every rule with real route durations; the client only checks what it can
 * know, so it never refuses a trip the server would accept.
 */
import type { BusinessTripSettings } from './settings';
import type { BusinessTripLegInput, BusinessTripType } from './types';
import { validateBusinessHourlyStart, validateBusinessLegTiming } from './validation';

export function emptyBusinessLeg(): BusinessTripLegInput {
  return {
    from_location_id: '',
    to_location_id: '',
    from_location_name: '',
    to_location_name: '',
    pickup_address: '',
    dropoff_address: '',
    date: '',
    time: '',
  };
}

/** The return journey of a round trip: the outbound reversed, keeping its own addresses and time. */
export function returnLegFor(outbound: BusinessTripLegInput, current?: BusinessTripLegInput): BusinessTripLegInput {
  return {
    from_location_id: outbound.to_location_id,
    to_location_id: outbound.from_location_id,
    from_location_name: outbound.to_location_name,
    to_location_name: outbound.from_location_name,
    pickup_address: current?.pickup_address || outbound.dropoff_address,
    dropoff_address: current?.dropoff_address || outbound.pickup_address,
    date: current?.date ?? '',
    time: current?.time ?? '',
  };
}

/** Initial journeys when the user switches to a trip type, reusing what was already entered. */
export function initialLegsFor(type: BusinessTripType, existing: BusinessTripLegInput[]): BusinessTripLegInput[] {
  const first = existing[0] ?? emptyBusinessLeg();
  if (type === 'hourly') return [{ ...first, to_location_id: '', to_location_name: '', dropoff_address: '' }];
  if (type === 'round_trip') return [first, returnLegFor(first, existing[1])];
  if (type === 'multi_city') return existing.length >= 2 ? existing : [first, existing[1] ?? emptyBusinessLeg()];
  return existing;
}

const MIN_ADDRESS = 5;

function legLabel(type: BusinessTripType, index: number): string {
  if (type === 'round_trip') return index === 0 ? 'Outbound' : 'Return';
  return `Journey ${index + 1}`;
}

export function validateBusinessTripDraft(
  type: BusinessTripType,
  legs: BusinessTripLegInput[],
  settings: BusinessTripSettings,
  now: Date = new Date()
): string | null {
  if (type === 'one_way') return null;

  if (type === 'hourly') {
    const leg = legs[0];
    if (!leg?.from_location_id) return 'Choose a pickup location.';
    if ((leg.pickup_address ?? '').trim().length < MIN_ADDRESS) return 'Enter the pickup address.';
    if (!leg.date || !leg.time) return 'Choose a start date and time.';
    return validateBusinessHourlyStart(leg.date, leg.time, { minNoticeHours: settings.hourly_min_notice_hours, now });
  }

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    const label = legLabel(type, index);
    if (!leg.from_location_id || !leg.to_location_id) return `${label}: choose both a pickup and a destination.`;
    if (leg.pickup_address.trim().length < MIN_ADDRESS) return `${label}: enter the pickup address.`;
    if (leg.dropoff_address.trim().length < MIN_ADDRESS) return `${label}: enter the dropoff address.`;
    if (!leg.date || !leg.time) return `${label}: choose a date and time.`;
  }

  // Order only: the real drive time is applied on the server, which knows each route's duration.
  return validateBusinessLegTiming(
    legs.map((leg) => ({ fromId: leg.from_location_id, toId: leg.to_location_id, date: leg.date, time: leg.time, durationMinutes: 1 })),
    {
      bufferMinutes: 0,
      maxLegs: type === 'round_trip' ? 2 : settings.multi_city_max_legs,
      roundTrip: type === 'round_trip',
      now,
    }
  );
}
