/**
 * Timing rules for business trips, shared by the wizard (client) and the create route (server).
 * SCOPE: Business module ONLY. Business twin of lib/trips/validation.ts. Do not de-duplicate.
 *
 * Each returns a user-facing message, or null when valid. Dates and times are operating-timezone
 * wall-clock, converted with `bookingWallClockToUtc` so a UTC server and a browser anywhere agree.
 */
import { bookingWallClockToUtc } from '@/lib/business/utils/timezone';
import { BUSINESS_DEFAULT_LEG_DURATION_MINUTES, BUSINESS_MAX_LEGS_HARD_LIMIT } from './constants';

export interface BusinessTimedLeg {
  fromId: string;
  toId: string;
  /** `yyyy-MM-dd` */
  date: string;
  /** `HH:mm` */
  time: string;
  /** Estimated drive time of this journey, from `routes.estimated_duration_minutes`. */
  durationMinutes?: number | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The UTC instant of a wall-clock date and time, or null when either is malformed. */
export function businessLegStart(leg: { date: string; time: string }): Date | null {
  if (!ISO_DATE.test(leg.date) || !HH_MM.test(leg.time)) return null;
  try {
    const start = bookingWallClockToUtc(leg.date, leg.time);
    return Number.isNaN(start.getTime()) ? null : start;
  } catch {
    return null;
  }
}

function formatGap(minutes: number): string {
  const plural = (count: number, unit: string): string => `${count} ${unit}${count === 1 ? '' : 's'}`;
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${plural(hours, 'hour')} ${plural(rest, 'minute')}` : plural(hours, 'hour');
}

/** Earliest allowed start of the journey after one that starts at `start`. */
export function nextLegEarliestStart(start: Date, durationMinutes: number | null | undefined, bufferMinutes: number): Date {
  const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : BUSINESS_DEFAULT_LEG_DURATION_MINUTES;
  return new Date(start.getTime() + (duration + bufferMinutes) * 60_000);
}

/**
 * Journeys must be complete, distinct, within the limit, in the future and in travel order:
 * each pickup at or after the previous journey's estimated arrival plus the buffer.
 */
export function validateBusinessLegTiming(
  legs: BusinessTimedLeg[],
  options: { bufferMinutes: number; maxLegs: number; now?: Date; roundTrip?: boolean }
): string | null {
  if (legs.length < 2) return 'Add at least two journeys.';
  const maxLegs = Math.min(options.maxLegs, BUSINESS_MAX_LEGS_HARD_LIMIT);
  if (legs.length > maxLegs) return `A trip can hold at most ${maxLegs} journeys.`;

  const now = options.now ?? new Date();
  let previousEnd: Date | null = null;

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    const label = options.roundTrip ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`;
    if (!leg.fromId || !leg.toId) return `${label}: choose both a pickup and a destination.`;
    if (leg.fromId === leg.toId) return `${label}: pickup and destination must differ.`;

    const start = businessLegStart(leg);
    if (!start) return `${label}: choose a valid date and time.`;
    if (start.getTime() <= now.getTime()) return `${label}: the pickup time has already passed.`;

    if (previousEnd && start.getTime() < previousEnd.getTime()) {
      const gap = formatGap(Math.round((previousEnd.getTime() - start.getTime()) / 60_000));
      return options.roundTrip
        ? `The return starts too soon after the outbound journey. Move it at least ${gap} later.`
        : `${label} starts too soon after journey ${index}. Move it at least ${gap} later.`;
    }

    previousEnd = nextLegEarliestStart(start, leg.durationMinutes, options.bufferMinutes);
  }

  return null;
}

/** A round trip's return must be the outbound route reversed. */
export function validateRoundTripRoute(legs: Pick<BusinessTimedLeg, 'fromId' | 'toId'>[]): string | null {
  if (legs.length !== 2) return 'A round trip has exactly two journeys.';
  const [outbound, back] = legs;
  if (back.fromId !== outbound.toId || back.toId !== outbound.fromId) {
    return 'The return journey must go back the way the outbound came.';
  }
  return null;
}

/** Hourly hire must start at least `minNoticeHours` from now. */
export function validateBusinessHourlyStart(
  date: string,
  time: string,
  options: { minNoticeHours: number; now?: Date }
): string | null {
  const start = businessLegStart({ date, time });
  if (!start) return 'Choose a valid date and start time.';
  const now = options.now ?? new Date();
  const earliest = now.getTime() + options.minNoticeHours * 3_600_000;
  if (start.getTime() < earliest) {
    return options.minNoticeHours > 0
      ? `Hourly hire needs at least ${options.minNoticeHours} hours notice.`
      : 'The start time has already passed.';
  }
  return null;
}
