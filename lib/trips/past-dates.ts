import { isIsoDate, parseLegs, serializeLegs, type RawSearchParams } from './search-params'
import type { TripLegParam } from './types'

/**
 * Every date picker stops at today, but a search or checkout URL can still
 * carry a past date: a bookmark, a shared link, a tab left open overnight or
 * the back button. Such a page used to list vehicles and fill the checkout form
 * for a day that has gone, and only refuse the booking on submit.
 *
 * Returns the params with every past date moved up to `today` (the operating
 * timezone's yyyy-MM-dd), or null when nothing needed moving. A round-trip
 * return and later multi-city journeys move with it only when they would
 * otherwise sit before the date in front of them. ISO dates compare as strings.
 */
export function rollPastDatesForward(params: RawSearchParams, today: string): URLSearchParams | null {
  const next = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    ;(Array.isArray(value) ? value : [value]).forEach((item) => next.append(key, item))
  })

  let changed = false

  const date = next.get('date')
  if (isIsoDate(date) && date < today) {
    next.set('date', today)
    changed = true
  }

  const departure = next.get('date')
  const returnDate = next.get('return')
  if (isIsoDate(returnDate) && isIsoDate(departure) && returnDate < departure) {
    next.set('return', departure)
    changed = true
  }

  const legs = parseLegs(next.get('legs') ?? undefined)
  if (legs) {
    const rolled = rollLegs(legs, today)
    if (rolled.some((leg, index) => leg.date !== legs[index].date)) {
      next.set('legs', serializeLegs(rolled))
      changed = true
    }
  }

  return changed ? next : null
}

function rollLegs(legs: TripLegParam[], today: string): TripLegParam[] {
  return legs.reduce<TripLegParam[]>((rolled, leg) => {
    const floor = rolled.length > 0 ? rolled[rolled.length - 1].date : today
    return [...rolled, leg.date < floor ? { ...leg, date: floor } : leg]
  }, [])
}
