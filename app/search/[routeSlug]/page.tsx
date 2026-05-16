import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
import { SearchResults } from '../results/components/search-results'
import { SearchSummary } from '../results/components/search-summary'
import { getSearchResults, getLocationDetails } from '../results/actions'
import { PublicLayout } from '@/components/layout/public-layout'
import { parseRouteSlug } from '@/lib/utils/slug'
import { resolveRouteSlugs } from '@/lib/utils/slug-resolver'

interface SearchRoutePageProps {
  params: Promise<{ routeSlug: string }>
  searchParams: Promise<{
    date?: string
    passengers?: string
  }>
}

export async function generateMetadata({ params }: SearchRoutePageProps): Promise<Metadata> {
  const { routeSlug } = await params
  const parsed = parseRouteSlug(routeSlug)

  if (!parsed) {
    return { title: 'Search Results | Transfer Booking' }
  }

  const resolved = await resolveRouteSlugs(parsed.origin, parsed.destination)
  if (!resolved) {
    return { title: 'Search Results | Transfer Booking' }
  }

  const originName = resolved.origin.name
  const destName = resolved.destination.name

  return {
    title: `Transfer from ${originName} to ${destName} | Infinia Transfers`,
    description: `Book luxury transfer from ${originName} to ${destName}. Compare vehicles and prices for your journey.`,
  }
}

export default async function SearchRoutePage({ params, searchParams }: SearchRoutePageProps) {
  const { routeSlug } = await params
  const sp = await searchParams
  const { date, passengers } = sp

  // Parse the route slug
  const parsed = parseRouteSlug(routeSlug)
  if (!parsed || !date || !passengers) {
    redirect('/')
  }

  // Resolve slugs to database records
  const resolved = await resolveRouteSlugs(parsed.origin, parsed.destination)
  if (!resolved) {
    notFound()
  }

  // Build search params based on resolution type
  const searchConfig =
    resolved.type === 'location'
      ? { originId: resolved.origin.id, destinationId: resolved.destination.id }
      : { fromZoneId: resolved.origin.id, toZoneId: resolved.destination.id }

  const [results, origin, destination] = await Promise.all([
    getSearchResults({
      ...searchConfig,
      date: new Date(date),
      passengers: parseInt(passengers),
    }),
    resolved.type === 'location' ? getLocationDetails(resolved.origin.id) : null,
    resolved.type === 'location' ? getLocationDetails(resolved.destination.id) : null,
  ])

  if (!results) {
    return (
      <PublicLayout>
        <div className="bg-[var(--black-void)] min-h-screen relative">
          <div className="luxury-container py-20 relative z-10">
            <div className="text-center bg-[var(--charcoal)] border border-[var(--graphite)] rounded-lg p-12 max-w-2xl mx-auto">
              <h2 className="t-headline mb-4">
                Unable to Load Search Results
              </h2>
              <p className="t-body mb-8">
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

  if (results.type === 'redirect' && results.redirectTo) {
    redirect(results.redirectTo)
  }

  // Pass slugs through searchParams so child components can build checkout URLs
  const enrichedSearchParams = {
    from: resolved.type === 'location' ? resolved.origin.id : undefined,
    to: resolved.type === 'location' ? resolved.destination.id : undefined,
    date,
    passengers,
    originSlug: parsed.origin,
    destSlug: parsed.destination,
  }

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)] relative min-h-screen">
        <div className="relative z-10">
          <SearchSummary
            origin={origin}
            destination={destination}
            date={new Date(date)}
            passengers={parseInt(passengers)}
          />

          <div className="luxury-container py-12 lg:py-16">
            <SearchResults results={results} searchParams={enrichedSearchParams} />
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
