import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
import { SearchResults } from '../results/components/search-results'
import { RouteBandMap } from '../results/components/route-band-map'
import { getSearchResults } from '../results/actions'
import { PublicLayout } from '@/components/layout/public-layout'
import { parseRouteSlug } from '@/lib/utils/slug'
import { resolveRouteSlugs } from '@/lib/utils/slug-resolver'
import { getSiteSettings } from '@/lib/site-settings/server'
import { parseTripSearchParams } from '@/lib/trips/search-params'
import { toRoundTripResults } from '../lib/round-trip-results'

interface SearchRoutePageProps {
  params: Promise<{ routeSlug: string }>
  searchParams: Promise<{
    date?: string
    /** Total guests. The breakdown below is optional. Links from route cards omit it. */
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    /** Round trip: `trip=round_trip&return=yyyy-MM-dd`. Absent for one way. */
    trip?: string
    return?: string
  }>
}

export async function generateMetadata({ params, searchParams }: SearchRoutePageProps): Promise<Metadata> {
  const { routeSlug } = await params
  const sp = await searchParams
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
    // Every trip variant is the same route: index the one-way page only.
    ...(sp.trip ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function SearchRoutePage({ params, searchParams }: SearchRoutePageProps) {
  const { routeSlug } = await params
  const sp = await searchParams
  const { date, passengers, adults, children, infants } = sp

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

  const results = await getSearchResults({
    ...searchConfig,
    date: new Date(date),
    passengers: parseInt(passengers),
  })

  // Round trip is offered between two locations (checkout books locations, not zones)
  // while the admin has it switched on. Anything else quietly searches one way.
  const requestedTrip = parseTripSearchParams(sp)
  const settings = await getSiteSettings()
  const trip =
    requestedTrip.trip === 'round_trip' && resolved.type === 'location' && settings.trip_types.round_trip_enabled
      ? requestedTrip
      : undefined

  if (trip && results?.vehicleTypes) {
    const roundTrip = await toRoundTripResults(
      results.vehicleTypes,
      resolved.origin.id,
      resolved.destination.id,
      settings.trip_types.round_trip_discount_percent
    )
    results.vehicleTypes = roundTrip.vehicleTypes
    results.vehicleTypesByCategory = roundTrip.vehicleTypesByCategory
  }

  if (!results) {
    return (
      <PublicLayout>
        <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
          <section className="editorial-section editorial-section--raised editorial-section--spacious grow">
            <div className="luxury-container">
              <div className="max-w-2xl">
                <div className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Search failed</div>
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

  if (results.type === 'redirect' && results.redirectTo) {
    redirect(results.redirectTo)
  }

  // Pass slugs through searchParams so child components can build checkout URLs.
  // The guest breakdown rides along so it survives into the checkout URL, without it the
  // composition captured on the home page would be lost here and never reach the booking.
  const enrichedSearchParams = {
    from: resolved.type === 'location' ? resolved.origin.id : undefined,
    to: resolved.type === 'location' ? resolved.destination.id : undefined,
    date,
    passengers,
    adults,
    children,
    infants,
    originSlug: parsed.origin,
    destSlug: parsed.destination,
    trip,
  }

  return (
    <PublicLayout>
      {/* SearchResults emits its own full-bleed bands, each with its own
          container, so this page supplies only the page ground. */}
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
        <SearchResults results={results} routeMap={<RouteBandMap />} searchParams={enrichedSearchParams} />
      </div>
    </PublicLayout>
  )
}
