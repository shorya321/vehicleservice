/**
 * Per-trip-type rules for a quotation trip, as a Zod superRefine.
 *
 * Structural only: counts, required fields, round-trip mirroring and journey order. The rules
 * that need the database or the admin settings (drive times, buffers, max journeys, notice for
 * hourly, whether the type is switched on) run where the trip is priced and converted, with the
 * same helpers the booking wizard uses.
 *
 * SCOPE: Business module ONLY
 */

import type { z } from 'zod';

interface TripTypeFields {
  trip_type: 'one_way' | 'round_trip' | 'multi_city' | 'hourly';
  to_location_id: string | null;
  dropoff_address: string | null;
  pickup_datetime: string | null;
  hourly_package: string | null;
  legs: Array<{ from_location_id: string; to_location_id: string; pickup_datetime: string | null }>;
}

const MIN_ADDRESS = 5;

function journeyLabel(roundTrip: boolean, index: number): string {
  if (roundTrip) return index === 0 ? 'Outbound' : 'Return';
  return `Journey ${index + 1}`;
}

function addGroupedIssues(d: TripTypeFields, issue: (message: string, path: string) => void): void {
  const roundTrip = d.trip_type === 'round_trip';
  if (roundTrip && d.legs.length !== 2) {
    issue('A round trip has an outbound and a return journey', 'legs');
    return;
  }
  if (!roundTrip && d.legs.length < 2) {
    issue('A multi-city trip needs at least 2 journeys', 'legs');
    return;
  }

  if (roundTrip) {
    const [out, back] = d.legs;
    if (back.from_location_id !== out.to_location_id || back.to_location_id !== out.from_location_id) {
      issue('The return journey must reverse the outbound route', 'legs');
    }
  }

  let previous: number | null = null;
  for (let index = 0; index < d.legs.length; index += 1) {
    const at = d.legs[index].pickup_datetime;
    const label = journeyLabel(roundTrip, index);
    if (!at) {
      issue(`${label}: choose a date and time`, 'legs');
      return;
    }
    const time = new Date(at).getTime();
    if (previous !== null && time <= previous) {
      issue(`${label} must start after the journey before it`, 'legs');
      return;
    }
    previous = time;
  }
}

export function addTripTypeIssues(d: TripTypeFields, ctx: z.RefinementCtx): void {
  const issue = (message: string, path: string): void => {
    ctx.addIssue({ code: 'custom', message, path: [path] });
  };

  if (d.trip_type !== 'hourly') {
    if (!d.to_location_id) issue('Invalid dropoff location', 'to_location_id');
    if ((d.dropoff_address ?? '').trim().length < MIN_ADDRESS) issue('Dropoff address required', 'dropoff_address');
  }

  if (d.trip_type === 'hourly') {
    if (!d.hourly_package) issue('Choose an hourly package', 'hourly_package');
    if (!d.pickup_datetime) issue('Hourly hire needs a start date and time', 'pickup_datetime');
    return;
  }

  if (d.trip_type === 'one_way') return;
  addGroupedIssues(d, issue);
}
