import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { PublicLayout } from '@/components/layout/public-layout'
import { getSeatedCount, resolveGuestsForVehicle } from '@/components/home/hero/guest-breakdown'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteSettings } from '@/lib/site-settings/server'
import { resolveVehicleTypeSlug } from '@/lib/utils/slug-resolver'
import { buildMultiCitySearchUrl } from '@/lib/utils/url-builder'
import { getRouteDurationMinutes, resolveLocationsBySlug } from '@/lib/trips/locations-server'
import { quoteLegFare } from '@/lib/trips/pricing-server'
import { parseTripSearchParams } from '@/lib/trips/search-params'
import type { CheckoutTrip } from '@/lib/trips/checkout-trip'
import type { RouteDetails } from '../../actions'
import { getActiveAddons, getVehicleType } from '../../actions'
import { currentCheckoutPath, loadCheckoutCustomer } from '../../lib/checkout-customer'
import { redirectIfPastDates } from '@/lib/trips/past-dates-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout, Multi-city Trip',
  robots: { index: false, follow: false },
}

interface MultiCityCheckoutPageProps {
  params: Promise<{ vehicleSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function MultiCityCheckoutPage({ params, searchParams }: MultiCityCheckoutPageProps) {
  const { vehicleSlug } = await params
  const sp = await searchParams
  redirectIfPastDates(`/checkout/multi-city/${vehicleSlug}`, sp)

  const settings = await getSiteSettings()
  if (!settings.trip_types.multi_city_enabled) notFound()

  const trip = parseTripSearchParams({ ...sp, trip: 'multi_city' })
  if (trip.trip !== 'multi_city' || !trip.legs || trip.legs.length > settings.trip_types.multi_city_max_legs) {
    redirect('/')
  }
  const legs = trip.legs

  const adminClient = createAdminClient()
  const [locations, vehicleRef] = await Promise.all([
    resolveLocationsBySlug(adminClient, legs.flatMap((leg) => [leg.from, leg.to])),
    resolveVehicleTypeSlug(vehicleSlug),
  ])
  if (!vehicleRef) redirect('/')

  const guestsRaw = {
    passengers: single(sp.passengers),
    adults: single(sp.adults),
    children: single(sp.children),
    infants: single(sp.infants),
  }
  const searchHref = buildMultiCitySearchUrl(legs, {
    passengers: guestsRaw.passengers || '1',
    adults: guestsRaw.adults ? Number(guestsRaw.adults) : undefined,
    children: guestsRaw.children ? Number(guestsRaw.children) : undefined,
    infants: guestsRaw.infants ? Number(guestsRaw.infants) : undefined,
  })

  const resolvedLegs = legs.map((leg) => ({ leg, from: locations.get(leg.from), to: locations.get(leg.to) }))
  if (resolvedLegs.some(({ from, to }) => !from || !to)) redirect('/')

  const { user, profile } = await loadCheckoutCustomer(currentCheckoutPath(`/checkout/multi-city/${vehicleSlug}`, sp))

  const [vehicleType, addonsData, { data: multiplierRow }] = await Promise.all([
    getVehicleType(vehicleRef.id),
    getActiveAddons(),
    adminClient.from('vehicle_types').select('price_multiplier').eq('id', vehicleRef.id).single(),
  ])
  if (!vehicleType) redirect('/')
  const multiplier = Number(multiplierRow?.price_multiplier) || 1

  const [fares, durations] = await Promise.all([
    Promise.all(resolvedLegs.map(({ from, to }) => quoteLegFare(adminClient, from!.id, to!.id, multiplier))),
    Promise.all(resolvedLegs.map(({ from, to }) => getRouteDurationMinutes(adminClient, from!.id, to!.id))),
  ])
  // A journey with no price: back to the results, where the card names it.
  if (fares.some((fare) => fare === null)) redirect(searchHref)

  const guests = resolveGuestsForVehicle(guestsRaw, vehicleType.passenger_capacity)
  const passengers = getSeatedCount(guests)

  const checkoutTrip: CheckoutTrip = {
    kind: 'multi_city',
    discountPercent: 0,
    bufferMinutes: settings.trip_types.leg_buffer_minutes,
    maxLegs: settings.trip_types.multi_city_max_legs,
    legs: resolvedLegs.map(({ leg, from, to }, index) => ({
      fromId: from!.id,
      fromName: from!.name,
      toId: to!.id,
      toName: to!.name,
      date: leg.date,
      time: leg.time,
      baseFare: fares[index] as number,
      durationMinutes: durations[index],
    })),
  }

  const first = checkoutTrip.legs[0]
  const last = checkoutTrip.legs[checkoutTrip.legs.length - 1]
  // The summary card's single-route fields (mobile bar) show the trip end to end.
  const route: RouteDetails = {
    id: `multi-${first.fromId}-${last.toId}`,
    route_name: `${first.fromName} to ${last.toName}`,
    distance_km: 0,
    estimated_duration_minutes: 0,
    base_price: 0,
    origin: { id: first.fromId, name: first.fromName, city: '', country_code: 'AE' },
    destination: { id: last.toId, name: last.toName, city: '', country_code: 'AE' },
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <CheckoutWrapper
          route={route}
          vehicleType={vehicleType}
          initialDate={first.date}
          initialTime={first.time ?? '10:00'}
          initialPassengers={passengers}
          initialGuests={guests}
          user={user}
          profile={profile}
          addonsByCategory={addonsData.addonsByCategory}
          changeHref={searchHref}
          trip={checkoutTrip}
        />
      </div>
    </PublicLayout>
  )
}
