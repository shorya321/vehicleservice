import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
import { SearchResults } from './components/search-results'
import { RouteBandMap } from './components/route-band-map'
import { getSearchResults } from './actions'
import { PublicLayout } from '@/components/layout/public-layout'

export const metadata = {
  title: 'Search Results | Transfer Booking',
  description: 'Available transfers for your selected route',
}

interface SearchResultsPageProps {
  searchParams: Promise<{
    from?: string
    to?: string
    fromZone?: string
    toZone?: string
    routeId?: string
    date?: string
    /** Total guests. The breakdown below is optional. Links that only know a total omit it. */
    passengers?: string
    adults?: string
    children?: string
    infants?: string
  }>
}

export default async function SearchResultsPage({ searchParams }: SearchResultsPageProps) {
  const params = await searchParams
  const { from, to, fromZone, toZone, routeId, date, passengers } = params

  // Support location-based, zone-based, and route-based searches
  if ((!from && !fromZone && !routeId) || !date || !passengers) {
    redirect('/')
  }

  const results = await getSearchResults({
    originId: from,
    destinationId: to,
    fromZoneId: fromZone,
    toZoneId: toZone,
    routeId: routeId,
    date: new Date(date),
    passengers: parseInt(passengers)
  })

  // Handle error case
  if (!results) {
    return (
      <PublicLayout>
        <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
          <section className="editorial-section editorial-section--raised editorial-section--spacious grow">
            <div className="luxury-container">
              <div className="max-w-2xl">
                <div className="editorial-eyebrow">Search failed</div>
                <h2 className="editorial-section-title mt-5">
                  Couldn&rsquo;t load results.
                </h2>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  A network or system issue interrupted the search. Try again, or start a new one from the home page.
                </p>
                <Link href="/" className="btn btn-primary mt-8 inline-flex">
                  Return to home
                </Link>
              </div>
            </div>
          </section>
        </div>
      </PublicLayout>
    )
  }

  // Handle redirect case (when no route exists between locations)
  if (results.type === 'redirect' && results.redirectTo) {
    redirect(results.redirectTo)
  }

  return (
    <PublicLayout>
      {/* SearchResults emits its own full-bleed bands, each with its own
          container, so this page supplies only the page ground. */}
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <SearchResults
          results={results}
          routeMap={<RouteBandMap origin={results.originPoint} destination={results.destinationPoint} />}
          searchParams={params}
        />
      </div>
    </PublicLayout>
  )
}