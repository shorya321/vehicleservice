import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PublicLayout } from '@/components/layout/public-layout'
import { getSiteSettings } from '@/lib/site-settings/server'
import { parseTripSearchParams } from '@/lib/trips/search-params'
import { RouteBandMap } from '../results/components/route-band-map'
import { MultiCityResults } from './components/multi-city-results'
import { getMultiCityResults } from './get-multi-city-results'
import { redirectIfPastDates } from '@/lib/trips/past-dates-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Multi-city Trip',
  description: 'Book several transfers as one trip, in one vehicle class, with one payment.',
  robots: { index: false, follow: true },
}

interface MultiCityPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function MultiCitySearchPage({ searchParams }: MultiCityPageProps) {
  const sp = await searchParams
  redirectIfPastDates('/search/multi-city', sp)
  const settings = await getSiteSettings()
  if (!settings.trip_types.multi_city_enabled) notFound()

  const passengers = single(sp.passengers)
  const partySize = parseInt(passengers ?? '')
  const trip = parseTripSearchParams({ ...sp, trip: 'multi_city' })
  if (trip.trip !== 'multi_city' || !trip.legs || !passengers || Number.isNaN(partySize) || partySize < 1) {
    redirect('/')
  }
  if (trip.legs.length > settings.trip_types.multi_city_max_legs) redirect('/')

  const results = await getMultiCityResults(trip.legs, partySize)
  if (!results) notFound()

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <MultiCityResults
          legs={results.legs.map((leg) => ({
            fromName: leg.fromLocation.name,
            toName: leg.toLocation.name,
            date: leg.date,
          }))}
          vehicleTypes={results.vehicleTypes}
          vehicleTypesByCategory={results.vehicleTypesByCategory}
          minPrice={results.minPrice}
          searchParams={{
            passengers,
            adults: single(sp.adults),
            children: single(sp.children),
            infants: single(sp.infants),
            trip,
          }}
          routeMap={<RouteBandMap />}
        />
      </div>
    </PublicLayout>
  )
}
