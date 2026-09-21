import {
  isHourlyPackage,
  isTripType,
  type TripLegParam,
  type TripSearchParams,
} from './types'
import { MAX_LEGS_HARD_LIMIT } from './constants'

/**
 * The single URL contract for trip types. Search pages, pickers, checkout and
 * the hero all read and write trip state through these two functions, so a
 * re-search never silently drops the return date or the legs.
 *
 * Query keys (one way emits none of them, so its URLs are unchanged):
 *   trip        round_trip | multi_city | hourly
 *   return      yyyy-MM-dd        (round trip)
 *   returnTime  HH:mm             (round trip, checkout only)
 *   package     half_day | full_day (hourly)
 *   legs        from~to@date[@HH:mm],from~to@date[@HH:mm]  (multi-city)
 *
 * Legs carry the two location slugs separately rather than a `{a}-to-{b}` route
 * slug, because location slugs may themselves contain `-to-`. `~`, `@` and `,`
 * never occur in a slug (they are `[a-z0-9-]` only).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const SLUG_RE = /^[a-z0-9-]+$/

export type RawSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_RE.test(value)
}

export function isHhMm(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value)
}

export function serializeLegs(legs: TripLegParam[]): string {
  return legs
    .map((leg) => [`${leg.from}~${leg.to}`, leg.date, leg.time].filter(Boolean).join('@'))
    .join(',')
}

/** Returns null when any leg is malformed, so a tampered URL fails closed. */
export function parseLegs(raw: string | undefined): TripLegParam[] | null {
  if (!raw) return null
  const parts = raw.split(',').filter(Boolean)
  if (parts.length < 2 || parts.length > MAX_LEGS_HARD_LIMIT) return null

  const legs: TripLegParam[] = []
  for (const part of parts) {
    const [pair, date, time, ...rest] = part.split('@')
    const [from, to, ...extra] = (pair ?? '').split('~')
    if (rest.length > 0 || extra.length > 0 || !isIsoDate(date)) return null
    if (!SLUG_RE.test(from ?? '') || !SLUG_RE.test(to ?? '') || from === to) return null
    if (time !== undefined && !isHhMm(time)) return null
    legs.push(time ? { from, to, date, time } : { from, to, date })
  }
  return legs
}

/**
 * Reads trip state from page `searchParams`. Anything missing or malformed
 * falls back to one way, which is always a valid search.
 */
export function parseTripSearchParams(params: RawSearchParams): TripSearchParams {
  const trip = first(params.trip)
  if (!isTripType(trip) || trip === 'one_way') return { trip: 'one_way' }

  if (trip === 'round_trip') {
    const returnDate = first(params.return)
    if (!isIsoDate(returnDate)) return { trip: 'one_way' }
    const returnTime = first(params.returnTime)
    return isHhMm(returnTime)
      ? { trip, returnDate, returnTime }
      : { trip, returnDate }
  }

  if (trip === 'hourly') {
    const hourlyPackage = first(params.package)
    return { trip, hourlyPackage: isHourlyPackage(hourlyPackage) ? hourlyPackage : 'half_day' }
  }

  const legs = parseLegs(first(params.legs))
  return legs ? { trip, legs } : { trip: 'one_way' }
}

/** Writes trip state into query params. One way writes nothing. */
export function appendTripSearchParams(target: URLSearchParams, trip: TripSearchParams | undefined): void {
  if (!trip || trip.trip === 'one_way') return
  target.set('trip', trip.trip)

  if (trip.trip === 'round_trip') {
    if (trip.returnDate) target.set('return', trip.returnDate)
    if (trip.returnTime) target.set('returnTime', trip.returnTime)
  } else if (trip.trip === 'hourly') {
    target.set('package', trip.hourlyPackage ?? 'half_day')
  } else if (trip.trip === 'multi_city' && trip.legs) {
    target.set('legs', serializeLegs(trip.legs))
  }
}

/** Keys owned by the trip contract; used when copying the remaining params verbatim. */
export const TRIP_PARAM_KEYS = ['trip', 'return', 'returnTime', 'package', 'legs'] as const
