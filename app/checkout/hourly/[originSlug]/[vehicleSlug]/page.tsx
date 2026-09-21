import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { PublicLayout } from '@/components/layout/public-layout'
import { getSeatedCount, resolveGuestsForVehicle } from '@/components/home/hero/guest-breakdown'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/site-settings/server'
import { resolveVehicleTypeSlug } from '@/lib/utils/slug-resolver'
import { bookingToday } from '@/lib/utils/timezone'
import { buildHourlySearchUrl } from '@/lib/utils/url-builder'
import { AS_DIRECTED } from '@/lib/trips/constants'
import { resolveLocationBySlug } from '@/lib/trips/locations-server'
import { getHourlyPackage } from '@/lib/trips/pricing-server'
import { isHhMm, isIsoDate, parseTripSearchParams } from '@/lib/trips/search-params'
import type { CheckoutTrip } from '@/lib/trips/checkout-trip'
import type { RouteDetails } from '../../../actions'
import { getActiveAddons, getLocationDetails, getVehicleType } from '../../../actions'
import { currentCheckoutPath, loadCheckoutCustomer } from '../../../lib/checkout-customer'
import { redirectIfPastDates } from '@/lib/trips/past-dates-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Checkout, Hourly Chauffeur Hire',
  robots: { index: false, follow: false },
}

interface HourlyCheckoutPageProps {
  params: Promise<{ originSlug: string; vehicleSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function HourlyCheckoutPage({ params, searchParams }: HourlyCheckoutPageProps) {
  const { originSlug, vehicleSlug } = await params
  const sp = await searchParams
  redirectIfPastDates(`/checkout/hourly/${originSlug}/${vehicleSlug}`, sp)

  const settings = await getSiteSettings()
  if (!settings.trip_types.hourly_enabled) notFound()

  const trip = parseTripSearchParams({ ...sp, trip: 'hourly' })
  const hourlyPackage = trip.trip === 'hourly' ? trip.hourlyPackage ?? 'half_day' : 'half_day'

  const supabase = await createClient()
  const [origin, vehicleRef] = await Promise.all([
    resolveLocationBySlug(supabase, originSlug),
    resolveVehicleTypeSlug(vehicleSlug),
  ])
  if (!origin || !origin.allowPickup || !vehicleRef) redirect('/')

  const { user, profile } = await loadCheckoutCustomer(
    currentCheckoutPath(`/checkout/hourly/${originSlug}/${vehicleSlug}`, sp)
  )

  const [originLocation, vehicleType, pkg, addonsData] = await Promise.all([
    getLocationDetails(origin.id),
    getVehicleType(vehicleRef.id),
    getHourlyPackage(supabase, vehicleRef.id, hourlyPackage),
    getActiveAddons(),
  ])
  // A package switched off while the customer was on the results page: back to search.
  if (!originLocation || !vehicleType || !pkg) redirect('/')

  const date = single(sp.date)
  const time = single(sp.time)
  const pickupDate = isIsoDate(date) ? date : bookingToday()
  const pickupTime = isHhMm(time) ? time : '10:00'

  const guests = resolveGuestsForVehicle(
    {
      passengers: single(sp.passengers),
      adults: single(sp.adults),
      children: single(sp.children),
      infants: single(sp.infants),
    },
    vehicleType.passenger_capacity
  )
  const passengers = getSeatedCount(guests)

  // The summary card draws every checkout as origin to destination; hourly has no
  // destination, so it reads "As directed" and carries no distance or route time.
  const route: RouteDetails = {
    id: `hourly-${origin.id}`,
    route_name: `${origin.name}, hourly`,
    distance_km: 0,
    estimated_duration_minutes: 0,
    base_price: pkg.price,
    origin: {
      id: originLocation.id,
      name: originLocation.name,
      city: originLocation.city || '',
      country_code: originLocation.country_code || 'AE',
    },
    destination: { id: '', name: AS_DIRECTED, city: '', country_code: originLocation.country_code || 'AE' },
  }

  const checkoutTrip: CheckoutTrip = {
    kind: 'hourly',
    hourlyPackage,
    hours: pkg.hours,
    includedKm: pkg.includedKm,
    extraHourPrice: pkg.extraHourPrice,
    price: pkg.price,
    minNoticeHours: settings.trip_types.hourly_min_notice_hours,
  }

  const changeHref = buildHourlySearchUrl(originSlug, {
    date: pickupDate,
    passengers,
    adults: guests.adults,
    children: guests.children,
    infants: guests.infants,
    hourlyPackage,
  })

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <CheckoutWrapper
          route={route}
          vehicleType={{ ...vehicleType, price: pkg.price }}
          initialDate={pickupDate}
          initialTime={pickupTime}
          initialPassengers={passengers}
          initialGuests={guests}
          user={user}
          profile={profile}
          addonsByCategory={addonsData.addonsByCategory}
          changeHref={changeHref}
          trip={checkoutTrip}
        />
      </div>
    </PublicLayout>
  )
}
