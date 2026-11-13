/**
 * Google Maps link for a stored location, so vendors and drivers open the exact pin
 * instead of guessing from a name ("Dubai Mall" exists more than once).
 *
 * Uses the documented Maps URLs format:
 *   https://www.google.com/maps/search/?api=1&query=<lat>,<lng>&query_place_id=<placeId>
 * `query` (the coordinates) is the fallback when the place id cannot be resolved.
 */
export interface MapPoint {
  latitude?: number | string | null
  longitude?: number | string | null
  google_place_id?: string | null
}

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/'

export function googleMapsUrl(point: MapPoint | null | undefined): string | null {
  if (!point) return null
  const lat = Number(point.latitude)
  const lng = Number(point.longitude)
  const hasCoords =
    point.latitude !== null && point.latitude !== undefined && point.latitude !== '' &&
    point.longitude !== null && point.longitude !== undefined && point.longitude !== '' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  if (!hasCoords) return null

  const params = new URLSearchParams({ api: '1', query: `${lat},${lng}` })
  if (point.google_place_id) params.set('query_place_id', point.google_place_id)
  return `${MAPS_SEARCH_URL}?${params.toString()}`
}

/** Flight numbers are free text from the customer: trim, collapse spaces, upper-case, cap length. */
export function normalizeFlightNumber(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value.trim().replace(/\s+/g, ' ').toUpperCase()
  if (cleaned.length < 2) return null
  return cleaned.slice(0, 20)
}
