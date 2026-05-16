import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
import { SearchResults } from './components/search-results'
import { SearchSummary } from './components/search-summary'
import { getSearchResults, getLocationDetails } from './actions'
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
    passengers?: string
  }>
}

export default async function SearchResultsPage({ searchParams }: SearchResultsPageProps) {
  const params = await searchParams
  const { from, to, fromZone, toZone, routeId, date, passengers } = params

  // Support location-based, zone-based, and route-based searches
  if ((!from && !fromZone && !routeId) || !date || !passengers) {
    redirect('/')
  }

  const [results, origin, destination] = await Promise.all([
    getSearchResults({
      originId: from,
      destinationId: to,
      fromZoneId: fromZone,
      toZoneId: toZone,
      routeId: routeId,
      date: new Date(date),
      passengers: parseInt(passengers)
    }),
    from ? getLocationDetails(from) : null,
    to ? getLocationDetails(to) : null,
  ])

  // Handle error case
  if (!results) {
    return (
      <PublicLayout>
        <div
          className="min-h-screen"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(var(--gold-rgb), 0.04) 0%, transparent 70%), var(--black-void)' }}
        >
          <div className="luxury-container py-24">
            <div className="mx-auto max-w-xl">
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
      <div
        className="min-h-screen"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(var(--gold-rgb), 0.04) 0%, transparent 70%), var(--black-void)' }}
      >
        <SearchSummary
          origin={origin}
          destination={destination}
          date={new Date(date)}
          passengers={parseInt(passengers)}
        />
        <div className="luxury-container py-12 lg:py-16">
          <SearchResults
            results={results}
            searchParams={params}
          />
        </div>
      </div>
    </PublicLayout>
  )
}