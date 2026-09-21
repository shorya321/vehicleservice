import { appendTripSearchParams } from '@/lib/trips/search-params'
import type { HourlyPackage, TripLegParam, TripSearchParams } from '@/lib/trips/types'

interface GuestParams {
  /** Total guests (adults + children + infants). Always emitted. */
  passengers: string | number
  adults?: number
  children?: number
  infants?: number
}

function appendGuests(target: URLSearchParams, params: GuestParams): void {
  if (params.adults !== undefined) target.set('adults', params.adults.toString())
  if (params.children !== undefined) target.set('children', params.children.toString())
  if (params.infants !== undefined) target.set('infants', params.infants.toString())
}

/**
 * Build SEO-friendly search URL
 * Example: /search/dubai-international-airport-to-abu-dhabi?date=2026-03-20&passengers=2
 */
export function buildSearchUrl(
  originSlug: string,
  destSlug: string,
  params: {
    date: string
    /**
     * Total guests (adults + children + infants). Always emitted. The results pages
     * redirect('/') when it is missing, and existing links/bookmarks rely on it.
     */
    passengers: string | number
    adults?: number
    children?: number
    infants?: number
  },
  /** Round trip state. Omitted (or one way) keeps the historical URL byte-identical. */
  trip?: TripSearchParams
): string {
  const routeSlug = `${originSlug}-to-${destSlug}`
  const searchParams = new URLSearchParams({
    date: params.date,
    passengers: params.passengers.toString(),
  })
  // Optional breakdown. Callers that only know a total (route cards, zone pages) omit these.
  if (params.adults !== undefined) searchParams.set('adults', params.adults.toString())
  if (params.children !== undefined) searchParams.set('children', params.children.toString())
  if (params.infants !== undefined) searchParams.set('infants', params.infants.toString())
  appendTripSearchParams(searchParams, trip)
  return `/search/${routeSlug}?${searchParams.toString()}`
}

/**
 * Build SEO-friendly checkout URL
 * Example: /checkout/dubai-international-airport-to-abu-dhabi/luxury-sedan?date=...&time=...&passengers=...
 */
export function buildCheckoutUrl(
  originSlug: string,
  destSlug: string,
  vehicleSlug: string,
  params: {
    date: string
    time: string
    /** Total guests (adults + children + infants). Always emitted. */
    passengers: string | number
    adults?: number
    children?: number
    infants?: number
  },
  trip?: TripSearchParams
): string {
  const routeSlug = `${originSlug}-to-${destSlug}`
  const searchParams = new URLSearchParams({
    date: params.date,
    time: params.time,
    passengers: params.passengers.toString(),
  })
  // Optional breakdown. Callers that only know a total (SEO route pages) omit these.
  if (params.adults !== undefined) searchParams.set('adults', params.adults.toString())
  if (params.children !== undefined) searchParams.set('children', params.children.toString())
  if (params.infants !== undefined) searchParams.set('infants', params.infants.toString())
  appendTripSearchParams(searchParams, trip)
  return `/checkout/${routeSlug}/${vehicleSlug}?${searchParams.toString()}`
}

/**
 * Hourly hire search. There is no destination, so it cannot use the
 * `{a}-to-{b}` path. Example: /search/hourly/dubai-marina?date=...&package=half_day&passengers=2
 */
export function buildHourlySearchUrl(
  originSlug: string,
  params: GuestParams & { date: string; hourlyPackage: HourlyPackage }
): string {
  const searchParams = new URLSearchParams({ date: params.date, passengers: params.passengers.toString() })
  appendGuests(searchParams, params)
  appendTripSearchParams(searchParams, { trip: 'hourly', hourlyPackage: params.hourlyPackage })
  return `/search/hourly/${originSlug}?${searchParams.toString()}`
}

export function buildHourlyCheckoutUrl(
  originSlug: string,
  vehicleSlug: string,
  params: GuestParams & { date: string; hourlyPackage: HourlyPackage }
): string {
  const searchParams = new URLSearchParams({ date: params.date, passengers: params.passengers.toString() })
  appendGuests(searchParams, params)
  appendTripSearchParams(searchParams, { trip: 'hourly', hourlyPackage: params.hourlyPackage })
  return `/checkout/hourly/${originSlug}/${vehicleSlug}?${searchParams.toString()}`
}

/** Multi-city search. Example: /search/multi-city?legs=a~b@2026-10-01,b~c@2026-10-03&passengers=2 */
export function buildMultiCitySearchUrl(legs: TripLegParam[], params: GuestParams): string {
  const searchParams = new URLSearchParams({ passengers: params.passengers.toString() })
  appendGuests(searchParams, params)
  appendTripSearchParams(searchParams, { trip: 'multi_city', legs })
  return `/search/multi-city?${searchParams.toString()}`
}

export function buildMultiCityCheckoutUrl(
  vehicleSlug: string,
  legs: TripLegParam[],
  params: GuestParams
): string {
  const searchParams = new URLSearchParams({ passengers: params.passengers.toString() })
  appendGuests(searchParams, params)
  appendTripSearchParams(searchParams, { trip: 'multi_city', legs })
  return `/checkout/multi-city/${vehicleSlug}?${searchParams.toString()}`
}

/**
 * Build payment URL using booking number, or a group number for a round trip or
 * multi-city trip (which is paid as one).
 * Example: /payment/BK1710000000ABCDE, /payment/GR260921AB12CD
 */
export function buildPaymentUrl(bookingNumber: string): string {
  return `/payment/${bookingNumber}`
}

/**
 * Build confirmation URL using booking number
 * Example: /booking/confirmation/BK1710000000ABCDE
 */
export function buildConfirmationUrl(bookingNumber: string): string {
  return `/booking/confirmation/${bookingNumber}`
}
