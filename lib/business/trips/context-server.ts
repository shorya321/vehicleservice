import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { businessTripContextLabel } from './display';

/**
 * "Round trip BG-..., return journey" / "Hourly hire: Half day, 5 hours, as directed" for the
 * per-journey emails (cancel, reschedule), or undefined for a one-way booking.
 * SCOPE: Business module ONLY.
 */
export async function loadBusinessTripContext(
  supabase: SupabaseClient,
  bookingId: string
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('business_bookings')
    .select('trip_type, leg_index, hourly_package, duration_hours, included_km, booking_group:booking_group_id(group_number, leg_count)')
    .eq('id', bookingId)
    .maybeSingle();
  if (error || !data) return undefined;

  const row = data as {
    trip_type: string | null;
    leg_index: number | null;
    hourly_package: string | null;
    duration_hours: number | null;
    included_km: number | null;
    booking_group: { group_number: string | null; leg_count: number | null } | { group_number: string | null; leg_count: number | null }[] | null;
  };
  const group = Array.isArray(row.booking_group) ? row.booking_group[0] : row.booking_group;
  return businessTripContextLabel(row, group) ?? undefined;
}
