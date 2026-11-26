import { bookingUtcToLocalInput } from '@/lib/utils/timezone'
import type { CheckoutTripKind } from './checkout-trip'

/**
 * How far ahead a customer pickup must be, and the earliest date and time the
 * checkout pickers may offer. Customer copy of the business module's
 * `pickup-floor.ts`; the two stay separate on purpose.
 *
 * The pickers grey out anything before the floor so a too-soon time cannot be
 * chosen at all. The booking actions still check the instant themselves (see
 * `validation.ts`); the floor only keeps the UI from offering what they refuse.
 */

/** Matches FormTimePicker's default `minuteStep`, so the floor is always an offered option. */
const SLOT_MINUTES = 5

/** Time filled in when a later day is picked before a time. */
const DEFAULT_TIME = '12:00'

export interface PickupFloor {
  /** `yyyy-MM-dd` in the operating timezone. */
  date: string
  /** `HH:mm` in the operating timezone. */
  time: string
}

export interface LeadSettings {
  /** `site_settings.config.customer_min_lead_hours` */
  minLeadHours: number
  /** `site_settings.config.trip_types.hourly_min_notice_hours` */
  hourlyMinNoticeHours: number
}

/** The two lead settings, read off the site settings config. */
export function leadSettingsOf(config: {
  customer_min_lead_hours: number
  trip_types: { hourly_min_notice_hours: number }
}): LeadSettings {
  return {
    minLeadHours: config.customer_min_lead_hours,
    hourlyMinNoticeHours: config.trip_types.hourly_min_notice_hours,
  }
}

/** Minutes of notice a trip type needs. Hourly hire takes the longer of its own notice and the lead. */
export function customerLeadMinutes(kind: CheckoutTripKind, settings: LeadSettings): number {
  const hours = kind === 'hourly'
    ? Math.max(settings.minLeadHours, settings.hourlyMinNoticeHours)
    : settings.minLeadHours
  return Math.max(0, hours) * 60
}

/** `now + leadMinutes`, rounded up to the next slot, split into operating-timezone date and time. */
export function customerPickupFloor(
  now: Date,
  leadMinutes: number,
  stepMinutes: number = SLOT_MINUTES
): PickupFloor {
  const stepMs = stepMinutes * 60_000
  // Rounded from the exact instant: at 10:20:30 a 12:20 floor would sit 30 seconds
  // inside a two-hour lead, and the server would refuse the slot the picker offered.
  const earliest = Math.ceil((now.getTime() + leadMinutes * 60_000) / stepMs) * stepMs
  const [date = '', time = ''] = bookingUtcToLocalInput(new Date(earliest).toISOString()).split('T')
  return { date, time }
}

/**
 * The date and time to keep once a date is chosen. On the floor day an empty or
 * too-soon time moves up to the floor; a later day keeps its time, or gets noon
 * when none was set. `HH:mm` strings compare correctly as text.
 */
export function adjustToFloor(date: string, time: string, floor: PickupFloor | null): PickupFloor {
  if (!date) return { date, time }
  if (floor && date === floor.date && (!time || time < floor.time)) return { date, time: floor.time }
  return { date, time: time || DEFAULT_TIME }
}

/** "2 hours", "1 hour", "90 minutes": for customer-facing notice copy. */
export function formatLead(minutes: number): string {
  if (minutes % 60 !== 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = minutes / 60
  return `${hours} hour${hours === 1 ? '' : 's'}`
}
