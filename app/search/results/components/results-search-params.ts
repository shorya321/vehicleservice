import {
  buildCheckoutUrl,
  buildHourlyCheckoutUrl,
  buildHourlySearchUrl,
  buildMultiCityCheckoutUrl,
  buildMultiCitySearchUrl,
  buildSearchUrl,
} from '@/lib/utils/url-builder'
import type { TripSearchParams } from '@/lib/trips/types'

/**
 * The search state every results component receives. It used to be restated
 * inline in eight files; trip state is the reason it is shared now, because any
 * component that rebuilt a URL from its own copy silently dropped the return
 * date, the hourly package or the legs.
 */
export interface ResultsSearchParams {
  from?: string
  to?: string
  date?: string
  /** Total guests. The breakdown below is optional; links from route cards omit it. */
  passengers?: string
  adults?: string
  children?: string
  infants?: string
  originSlug?: string
  destSlug?: string
  /** Absent or one way for the historical transfer search. */
  trip?: TripSearchParams
}

export interface GuestOverride {
  passengers: number | string
  adults?: number
  children?: number
  infants?: number
}

export function toCount(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const n = parseInt(value)
  return Number.isNaN(n) ? undefined : n
}

function currentGuests(sp: ResultsSearchParams): GuestOverride {
  return {
    passengers: sp.passengers || '1',
    adults: toCount(sp.adults),
    children: toCount(sp.children),
    infants: toCount(sp.infants),
  }
}

/**
 * The same search with a new date and/or party. Null when the page has no
 * slugs (the legacy `/search/results` route), which callers handle by copying
 * their own params.
 */
export function rebuildSearchUrl(
  sp: ResultsSearchParams,
  change: { date?: string; returnDate?: string; guests?: GuestOverride }
): string | null {
  const guests = change.guests ?? currentGuests(sp)
  const date = change.date ?? sp.date ?? ''
  const trip = sp.trip

  if (trip?.trip === 'hourly' && sp.originSlug) {
    return buildHourlySearchUrl(sp.originSlug, {
      date,
      ...guests,
      hourlyPackage: trip.hourlyPackage ?? 'half_day',
    })
  }

  if (trip?.trip === 'multi_city' && trip.legs) {
    return buildMultiCitySearchUrl(trip.legs, guests)
  }

  if (!sp.originSlug || !sp.destSlug) return null

  if (trip?.trip === 'round_trip') {
    // Moving the outbound past the return drags the return along, so the
    // search never lands in a state checkout will refuse.
    let returnDate = change.returnDate ?? trip.returnDate ?? date
    if (returnDate < date) returnDate = date
    return buildSearchUrl(sp.originSlug, sp.destSlug, { date, ...guests }, {
      trip: 'round_trip',
      returnDate,
    })
  }

  return buildSearchUrl(sp.originSlug, sp.destSlug, { date, ...guests })
}

/**
 * Where a vehicle card's Select goes. Null means the card must fall back to the
 * legacy query-param checkout.
 */
export function buildSelectionUrl(sp: ResultsSearchParams, vehicleSlug: string): string | null {
  const guests = currentGuests(sp)
  const trip = sp.trip

  if (trip?.trip === 'hourly' && sp.originSlug) {
    return buildHourlyCheckoutUrl(sp.originSlug, vehicleSlug, {
      date: sp.date || '',
      ...guests,
      hourlyPackage: trip.hourlyPackage ?? 'half_day',
    })
  }

  if (trip?.trip === 'multi_city' && trip.legs) {
    return buildMultiCityCheckoutUrl(vehicleSlug, trip.legs, guests)
  }

  if (!sp.originSlug || !sp.destSlug) return null

  return buildCheckoutUrl(
    sp.originSlug,
    sp.destSlug,
    vehicleSlug,
    { date: sp.date || '', time: '10:00', ...guests },
    trip?.trip === 'round_trip' ? trip : undefined
  )
}
