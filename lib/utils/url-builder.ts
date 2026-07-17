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
     * Total guests (adults + children + infants). Always emitted — the results pages
     * redirect('/') when it is missing, and existing links/bookmarks rely on it.
     */
    passengers: string | number
    adults?: number
    children?: number
    infants?: number
  }
): string {
  const routeSlug = `${originSlug}-to-${destSlug}`
  const searchParams = new URLSearchParams({
    date: params.date,
    passengers: params.passengers.toString(),
  })
  // Optional breakdown — callers that only know a total (route cards, zone pages) omit these.
  if (params.adults !== undefined) searchParams.set('adults', params.adults.toString())
  if (params.children !== undefined) searchParams.set('children', params.children.toString())
  if (params.infants !== undefined) searchParams.set('infants', params.infants.toString())
  return `/search/${routeSlug}?${searchParams.toString()}`
}

/**
 * Build SEO-friendly checkout URL
 * Example: /checkout/dubai-international-airport-to-abu-dhabi/luxury-sedan?date=...&time=...&passengers=...&luggage=...
 */
export function buildCheckoutUrl(
  originSlug: string,
  destSlug: string,
  vehicleSlug: string,
  params: { date: string; time: string; passengers: string | number; luggage: string | number }
): string {
  const routeSlug = `${originSlug}-to-${destSlug}`
  const searchParams = new URLSearchParams({
    date: params.date,
    time: params.time,
    passengers: params.passengers.toString(),
    luggage: params.luggage.toString(),
  })
  return `/checkout/${routeSlug}/${vehicleSlug}?${searchParams.toString()}`
}

/**
 * Build payment URL using booking number
 * Example: /payment/BK1710000000ABCDE
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
