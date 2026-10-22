'use server';

/**
 * How far ahead a rescheduled pickup must be, for the Edit Date/Time picker.
 * SCOPE: Business module ONLY.
 *
 * The longer of the reschedule cutoff and the admin's business lead time (hourly hire: its notice,
 * if longer still), so the picker offers nothing the datetime route would refuse. The route
 * checks again either way.
 *
 * No exported types here: a 'use server' module may only export async functions.
 */

import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { MODIFICATION_CUTOFF_HOURS } from '@/lib/business/booking-utils';
import { getBusinessTripSettings } from '@/lib/business/trips/settings-server';
import { effectiveLeadMinutes } from '@/lib/business/trips/pickup-floor';

/** Minutes from now, or null when the booking cannot be read (the picker then uses the cutoff). */
export async function getRescheduleLeadMinutes(bookingId: string): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const member = await getBusinessMember(supabase, user.id);
    if (!member) return null;

    const { data: booking, error } = await supabase
      .from('business_bookings')
      .select('trip_type')
      .eq('id', bookingId)
      .eq('business_account_id', member.businessAccountId)
      .maybeSingle();
    if (error || !booking) return null;

    const settings = await getBusinessTripSettings(supabase);
    const lead = effectiveLeadMinutes(booking.trip_type === 'hourly' ? 'hourly' : 'one_way', settings);
    return Math.max(MODIFICATION_CUTOFF_HOURS * 60, lead);
  } catch (error) {
    console.error('[business bookings] reschedule lead lookup failed:', error);
    return null;
  }
}
