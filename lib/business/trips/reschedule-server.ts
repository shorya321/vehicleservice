import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { getBusinessTripSettings } from './settings-server';
import { getBusinessRouteDurationMinutes } from './pricing-server';
import { nextLegEarliestStart } from './validation';
import { businessLegLabel } from './display';

/**
 * Extra rules for moving one journey of a trip, on top of the normal reschedule rules:
 * - a journey stays after the one before it (its drive time plus the buffer) and before the one
 *   after it, so a return can never be moved ahead of its outbound;
 * - an hourly hire keeps the hourly notice period.
 * Returns a user-facing message, or null when the move is allowed. One way: always null.
 * SCOPE: Business module ONLY.
 */
export interface ReschedulableBooking {
  id: string;
  trip_type?: string | null;
  booking_group_id?: string | null;
  leg_index?: number | null;
  from_location_id: string;
  to_location_id: string | null;
}

type Client = SupabaseClient<Database>;

const LIVE = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed'];

/** "the outbound journey", "journey 2 of 3". */
const journeyPhrase = (label: string | null, fallback: string): string => {
  if (!label) return fallback;
  return label === 'Outbound' || label === 'Return' ? `the ${label.toLowerCase()} journey` : label.toLowerCase();
};

const formatGap = (ms: number): string => {
  const minutes = Math.ceil(ms / 60_000);
  return minutes < 60 ? `${minutes} minutes` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export async function checkBusinessTripReschedule(
  supabase: Client,
  booking: ReschedulableBooking,
  newPickupIso: string
): Promise<string | null> {
  const newStart = new Date(newPickupIso);
  if (booking.trip_type === 'hourly') {
    const settings = await getBusinessTripSettings(supabase);
    const earliest = Date.now() + settings.hourly_min_notice_hours * 3_600_000;
    return newStart.getTime() < earliest
      ? `Hourly hire needs at least ${settings.hourly_min_notice_hours} hours notice.`
      : null;
  }

  if (!booking.booking_group_id || booking.leg_index === null || booking.leg_index === undefined) return null;

  const [settings, { data: legs, error }] = await Promise.all([
    getBusinessTripSettings(supabase),
    supabase
      .from('business_bookings')
      .select('id, leg_index, pickup_datetime, from_location_id, to_location_id, booking_status, trip_type')
      .eq('booking_group_id', booking.booking_group_id)
      .order('leg_index', { ascending: true }),
  ]);
  if (error || !legs) return 'Unable to check the other journeys of this trip. Please try again.';

  const others = legs.filter((leg) => leg.id !== booking.id && LIVE.includes(leg.booking_status));
  const index = booking.leg_index;
  const previous = [...others].reverse().find((leg) => (leg.leg_index ?? 0) < index);
  const next = others.find((leg) => (leg.leg_index ?? 0) > index);

  if (previous?.to_location_id) {
    const duration = await getBusinessRouteDurationMinutes(supabase, previous.from_location_id, previous.to_location_id);
    const earliest = nextLegEarliestStart(new Date(previous.pickup_datetime), duration, settings.leg_buffer_minutes);
    if (newStart.getTime() < earliest.getTime()) {
      const label = journeyPhrase(businessLegLabel(previous, legs.length), 'the previous journey');
      return `This journey must start at least ${formatGap(earliest.getTime() - newStart.getTime())} later, after ${label}.`;
    }
  }

  if (next && booking.to_location_id) {
    const duration = await getBusinessRouteDurationMinutes(supabase, booking.from_location_id, booking.to_location_id);
    const latestEnd = nextLegEarliestStart(newStart, duration, settings.leg_buffer_minutes);
    if (latestEnd.getTime() > new Date(next.pickup_datetime).getTime()) {
      const label = journeyPhrase(businessLegLabel(next, legs.length), 'the next journey');
      return `This journey would run into ${label}. Move it at least ${formatGap(latestEnd.getTime() - new Date(next.pickup_datetime).getTime())} earlier.`;
    }
  }

  return null;
}
