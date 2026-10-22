/**
 * The earliest pickup a business may book, as operating-timezone wall-clock, for the pickers.
 * SCOPE: Business module ONLY.
 *
 * The pickers grey out anything before the floor so a too-soon time cannot be chosen at all.
 * The servers still check the instant themselves (see validation.ts); this only keeps the UI
 * from offering what they would refuse.
 */
import { bookingUtcToLocalInput } from '@/lib/business/utils/timezone';
import type { BusinessTripSettings } from './settings';
import type { BusinessTripType } from './types';

/** Matches FormTimePicker's default `minuteStep`, so the floor is always an offered option. */
const SLOT_MINUTES = 5;

/** Time filled in when a later day is picked before a time. */
const DEFAULT_TIME = '12:00';

export interface PickupFloor {
  /** `yyyy-MM-dd` */
  date: string;
  /** `HH:mm` */
  time: string;
}

/** `now + leadMinutes`, rounded up to the next slot, split into Dubai date and time. */
export function pickupFloor(now: Date, leadMinutes: number, stepMinutes: number = SLOT_MINUTES): PickupFloor {
  const stepMs = stepMinutes * 60_000;
  // Rounded from the exact instant: at 10:20:30 a 12:20 floor would sit 30 seconds inside a
  // two-hour lead, and the server would refuse the very slot the picker offered.
  const earliest = Math.ceil((now.getTime() + leadMinutes * 60_000) / stepMs) * stepMs;
  const [date = '', time = ''] = bookingUtcToLocalInput(new Date(earliest).toISOString()).split('T');
  return { date, time };
}

/** Minutes of notice a trip type needs. Hourly hire takes the longer of its own notice and the lead. */
export function effectiveLeadMinutes(
  type: BusinessTripType,
  settings: Pick<BusinessTripSettings, 'min_lead_hours' | 'hourly_min_notice_hours'>
): number {
  const hours = type === 'hourly' ? Math.max(settings.min_lead_hours, settings.hourly_min_notice_hours) : settings.min_lead_hours;
  return hours * 60;
}

/**
 * The date and time to store once a date is chosen. An empty time is filled (the floor on the
 * floor day, noon later), and a time the new date makes too soon is moved up to the floor.
 * `HH:mm` strings compare correctly as text.
 */
export function adjustToFloor(date: string, time: string, floor: PickupFloor | null): PickupFloor {
  if (!date) return { date, time };
  if (floor && date === floor.date && (!time || time < floor.time)) return { date, time: floor.time };
  return { date, time: time || DEFAULT_TIME };
}
