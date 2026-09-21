import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PublicLayout } from '@/components/layout/public-layout'
import { getSiteSettings } from '@/lib/site-settings/server'
import { isIsoDate, parseTripSearchParams } from '@/lib/trips/search-params'
import { RouteBandMap } from '../../results/components/route-band-map'
import { HourlyResults } from './components/hourly-results'
import { getHourlyResults } from './get-hourly-results'

export const dynamic = 'force-dynamic'

interface HourlySearchPageProps {
  params: Promise<{ originSlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export const metadata: Metadata = {
  title: 'Hourly Chauffeur Hire',
  description: 'Hire a chauffeur and vehicle by the half day or full day, as directed.',
  // A search result, not a landing page: keep every date and party variant out of the index.
  robots: { index: false, follow: true },
}

export default async function HourlySearchPage({ params, searchParams }: HourlySearchPageProps) {
  const { originSlug } = await params
  const sp = await searchParams
  const settings = await getSiteSettings()
  if (!settings.trip_types.hourly_enabled) notFound()

  const date = single(sp.date)
  const passengers = single(sp.passengers)
  const partySize = parseInt(passengers ?? '')
  if (!isIsoDate(date) || !passengers || Number.isNaN(partySize) || partySize < 1) {
    redirect('/')
  }

  const trip = parseTripSearchParams({ ...sp, trip: 'hourly' })
  const hourlyPackage = trip.trip === 'hourly' ? trip.hourlyPackage ?? 'half_day' : 'half_day'

  const results = await getHourlyResults(originSlug, hourlyPackage, partySize)
  if (!results) notFound()

  const resultsSearchParams = {
    from: results.origin.id,
    date,
    passengers,
    adults: single(sp.adults),
    children: single(sp.children),
    infants: single(sp.infants),
    originSlug,
    trip,
  }

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <HourlyResults
          originName={results.origin.name}
          originSlug={originSlug}
          hourlyPackage={hourlyPackage}
          vehicleTypes={results.vehicleTypes}
          vehicleTypesByCategory={results.vehicleTypesByCategory}
          minPrice={results.minPrice}
          hours={results.hours}
          searchParams={resultsSearchParams}
          routeMap={<RouteBandMap />}
        />
      </div>
    </PublicLayout>
  )
}
