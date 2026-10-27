import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { parseRouteSlug } from '@/lib/utils/slug'
import { resolveRouteSlugs, resolveVehicleTypeSlug } from '@/lib/utils/slug-resolver'
import { getSeatedCount, resolveGuestsForVehicle } from '@/components/home/hero/guest-breakdown'
import { isTripType, type TripType } from '@/lib/trips/types'

export interface SummaryStop {
  name: string
  city: string | null
}

export interface SummaryVehicle {
  name: string
  category: string | null
  seats: number | null
  bags: number | null
  imageUrl: string | null
}

/** What the checkout sign-in ticket shows. Every field is optional: a part that cannot be resolved is left off. */
export interface CheckoutBookingSummary {
  from: SummaryStop | null
  to: SummaryStop | null
  distanceKm: number | null
  durationMinutes: number | null
  /** "Mon 26 Oct 2026", formatted from the calendar date in the link. */
  dateLabel: string | null
  time: string | null
  passengers: number | null
  trip: TripType
  vehicle: SummaryVehicle | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

const EMPTY: CheckoutBookingSummary = {
  from: null,
  to: null,
  distanceKm: null,
  durationMinutes: null,
  dateLabel: null,
  time: null,
  passengers: null,
  trip: 'one_way',
  vehicle: null,
}

/**
 * A calendar date round-trips through UTC on both ends, so the label is the
 * same day the traveller picked whatever zone the server runs in.
 */
function formatCalendarDate(value: string | null): string | null {
  const match = value ? ISO_DATE.exec(value) : null
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(date.getTime())) return null
  const part = (options: Intl.DateTimeFormatOptions): string => date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' })
  return `${part({ weekday: 'short' })} ${part({ day: 'numeric' })} ${part({ month: 'short' })} ${part({ year: 'numeric' })}`
}

function parseReturnUrl(returnUrl: string): URL | null {
  try {
    const decoded = decodeURIComponent(returnUrl)
    if (!decoded.startsWith('/checkout') || decoded.startsWith('//')) return null
    return new URL(decoded, 'http://local.invalid')
  } catch {
    return null
  }
}

/**
 * Read the booking the traveller is signing in to finish from the checkout
 * return link. Handles both checkout shapes: the slug route
 * `/checkout/{origin}-to-{destination}/{vehicle}` and the older
 * `/checkout?from={id}&to={id}&vehicleType={id}`. Never throws: the sign-in
 * form must render even when the lookup fails.
 */
export async function getCheckoutBookingSummary(returnUrl: string): Promise<CheckoutBookingSummary> {
  const url = parseReturnUrl(returnUrl)
  if (!url) return EMPTY

  const sp = url.searchParams
  const trip = sp.get('trip')
  const time = sp.get('time')
  const base: CheckoutBookingSummary = {
    ...EMPTY,
    dateLabel: formatCalendarDate(sp.get('date')),
    time: time && HH_MM.test(time) ? time : null,
    trip: isTripType(trip) ? trip : 'one_way',
  }

  try {
    const supabase = await createClient()
    let fromId: string | null = null
    let toId: string | null = null
    let vehicleId: string | null = null
    let from: SummaryStop | null = null
    let to: SummaryStop | null = null

    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 3) {
      const parsed = parseRouteSlug(segments[1])
      const [route, vehicleRef] = await Promise.all([
        parsed ? resolveRouteSlugs(parsed.origin, parsed.destination) : Promise.resolve(null),
        resolveVehicleTypeSlug(segments[2]),
      ])
      if (route?.type === 'location') {
        fromId = route.origin.id
        toId = route.destination.id
        from = { name: route.origin.name, city: route.origin.city ?? null }
        to = { name: route.destination.name, city: route.destination.city ?? null }
      } else if (route?.type === 'zone') {
        from = { name: route.origin.name, city: null }
        to = { name: route.destination.name, city: null }
      }
      vehicleId = vehicleRef?.id ?? null
    } else {
      const rawFrom = sp.get('from')
      const rawTo = sp.get('to')
      const rawVehicle = sp.get('vehicleType')
      fromId = rawFrom && UUID.test(rawFrom) ? rawFrom : null
      toId = rawTo && UUID.test(rawTo) ? rawTo : null
      vehicleId = rawVehicle && UUID.test(rawVehicle) ? rawVehicle : null

      const ids = [fromId, toId].filter((id): id is string => id !== null)
      if (ids.length > 0) {
        const { data, error } = await supabase.from('locations').select('id, name, city').in('id', ids)
        if (error) console.error('[checkout-login] location lookup failed:', error.message)
        const byId = new Map((data ?? []).map((row) => [row.id, { name: row.name, city: row.city ?? null }]))
        from = fromId ? byId.get(fromId) ?? null : null
        to = toId ? byId.get(toId) ?? null : null
      }
    }

    const [routeRow, vehicleRow] = await Promise.all([
      fromId && toId
        ? supabase
            .from('routes')
            .select('distance_km, estimated_duration_minutes')
            .eq('origin_location_id', fromId)
            .eq('destination_location_id', toId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()
        : Promise.resolve(null),
      vehicleId
        ? supabase
            .from('vehicle_types')
            .select('name, passenger_capacity, luggage_capacity, image_url, vehicle_categories(name)')
            .eq('id', vehicleId)
            .maybeSingle()
        : Promise.resolve(null),
    ])

    if (routeRow?.error) console.error('[checkout-login] route lookup failed:', routeRow.error.message)
    if (vehicleRow?.error) console.error('[checkout-login] vehicle lookup failed:', vehicleRow.error.message)

    const vehicleData = vehicleRow?.data ?? null
    const category = vehicleData?.vehicle_categories
    const vehicle: SummaryVehicle | null = vehicleData
      ? {
          name: vehicleData.name,
          category: (Array.isArray(category) ? category[0]?.name : category?.name) ?? null,
          seats: vehicleData.passenger_capacity ?? null,
          bags: vehicleData.luggage_capacity ?? null,
          imageUrl: vehicleData.image_url ?? null,
        }
      : null

    // Same guest rule checkout uses, so the ticket and the next page agree.
    const guests = resolveGuestsForVehicle(
      {
        passengers: sp.get('passengers') ?? undefined,
        adults: sp.get('adults') ?? undefined,
        children: sp.get('children') ?? undefined,
        infants: sp.get('infants') ?? undefined,
      },
      vehicle?.seats ?? Number.MAX_SAFE_INTEGER
    )
    const hasGuestParam = sp.has('passengers') || sp.has('adults')

    const distance = routeRow?.data?.distance_km
    return {
      ...base,
      from,
      to,
      distanceKm: distance != null ? Math.round(Number(distance)) : null,
      durationMinutes: routeRow?.data?.estimated_duration_minutes ?? null,
      passengers: hasGuestParam ? getSeatedCount(guests) : null,
      vehicle,
    }
  } catch (error: unknown) {
    console.error('[checkout-login] booking summary failed:', error instanceof Error ? error.message : error)
    return base
  }
}
