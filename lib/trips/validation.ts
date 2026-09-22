import { bookingWallClockToUtc } from '@/lib/utils/timezone'
import { MAX_LEGS_HARD_LIMIT } from './constants'
import { isHhMm, isIsoDate } from './search-params'

/**
 * Timing rules shared by the checkout form (client) and the booking actions
 * (server). Each returns a customer-facing message, or null when valid. All
 * dates and times are operating-timezone wall-clock, converted through
 * `bookingWallClockToUtc` so the same rule gives the same answer on a UTC
 * server and in a browser anywhere.
 */

/** Used when a route has no recorded duration. */
export const DEFAULT_LEG_DURATION_MINUTES = 60

export interface TimedLeg {
  fromId: string
  toId: string
  date: string
  time: string
  /** Estimated drive time of this leg, from `routes.estimated_duration_minutes`. */
  durationMinutes?: number | null
}

function legStart(leg: Pick<TimedLeg, 'date' | 'time'>): Date | null {
  if (!isIsoDate(leg.date) || !isHhMm(leg.time)) return null
  try {
    return bookingWallClockToUtc(leg.date, leg.time)
  } catch {
    return null
  }
}

function formatGap(minutes: number): string {
  const plural = (count: number, unit: string): string => `${count} ${unit}${count === 1 ? '' : 's'}`
  if (minutes < 60) return plural(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${plural(hours, 'hour')} ${plural(rest, 'minute')}` : plural(hours, 'hour')
}

/**
 * Legs must be valid, distinct, within the leg limit, not in the past, and in
 * travel order: each pickup at or after the previous leg's estimated arrival
 * plus the buffer. A round trip is the two-leg case of the same rule.
 */
export function validateLegTiming(
  legs: TimedLeg[],
  options: { bufferMinutes: number; maxLegs: number; now?: Date; roundTrip?: boolean }
): string | null {
  if (legs.length < 2) return 'Add at least two journeys.'
  const maxLegs = Math.min(options.maxLegs, MAX_LEGS_HARD_LIMIT)
  if (legs.length > maxLegs) return `A trip can hold at most ${maxLegs} journeys.`

  const now = options.now ?? new Date()
  let previousEnd: Date | null = null

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index]
    // A round trip's checkout says Outbound and Return, so its errors do too.
    const label = options.roundTrip ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`
    if (!leg.fromId || !leg.toId) return `${label}: choose both a pickup and a destination.`
    if (leg.fromId === leg.toId) return `${label}: pickup and destination must differ.`

    const start = legStart(leg)
    if (!start) return `${label}: choose a valid date and time.`
    if (start.getTime() <= now.getTime()) return `${label}: the pickup time has already passed.`

    if (previousEnd && start.getTime() < previousEnd.getTime()) {
      const gap = formatGap(Math.round((previousEnd.getTime() - start.getTime()) / 60_000))
      return options.roundTrip
        ? `Your return starts too soon after the outbound journey. Move it at least ${gap} later.`
        : `${label} starts too soon after journey ${index}. Move it at least ${gap} later.`
    }

    const duration = leg.durationMinutes && leg.durationMinutes > 0
      ? leg.durationMinutes
      : DEFAULT_LEG_DURATION_MINUTES
    previousEnd = new Date(start.getTime() + (duration + options.bufferMinutes) * 60_000)
  }

  return null
}

/**
 * A one-way pickup must still be ahead of now. The date can be today (a stale
 * link is moved up to today), so the time alone can already have gone.
 */
export function validatePickupStart(
  date: string,
  time: string,
  options: { now?: Date } = {}
): string | null {
  const start = legStart({ date, time })
  if (!start) return 'Choose a valid pickup date and time.'
  const now = options.now ?? new Date()
  return start.getTime() <= now.getTime() ? 'The pickup time has already passed. Choose a later time.' : null
}

/** Hourly hire must start at least `minNoticeHours` from now. */
export function validateHourlyStart(
  date: string,
  time: string,
  options: { minNoticeHours: number; now?: Date }
): string | null {
  const start = legStart({ date, time })
  if (!start) return 'Choose a valid date and start time.'

  const now = options.now ?? new Date()
  const earliest = now.getTime() + options.minNoticeHours * 3_600_000
  if (start.getTime() < earliest) {
    return options.minNoticeHours > 0
      ? `Hourly hire needs at least ${options.minNoticeHours} hours notice.`
      : 'The start time has already passed.'
  }
  return null
}
