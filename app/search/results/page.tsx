import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
import { SearchResults } from './components/search-results'
import { SearchSummary } from './components/search-summary'
import { getSearchResults, getLocationDetails } from './actions'
import { PublicLayout } from '@/components/layout/public-layout'
import { AmbientBackground } from '@/components/checkout/ambient-background'

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
        <div className="bg-luxury-black min-h-screen relative">
          <AmbientBackground />
          <div className="luxury-container py-20 relative z-10">
            <div className="text-center backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-12 max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl text-luxury-pearl mb-4">
                Unable to Load Search Results
              </h2>
              <p className="text-luxury-lightGray mb-8">
                We&apos;re experiencing some issues. Please try again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-black"
              >
                Return to Home
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
      <div className="bg-luxury-black relative min-h-screen">
        <AmbientBackground />
        <div className="relative z-10">
          <SearchSummary
            origin={origin}
            destination={destination}
            date={new Date(date)}
            passengers={parseInt(passengers)}
          />

          <div className="luxury-container py-8">
            <SearchResults
              results={results}
              searchParams={params}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}