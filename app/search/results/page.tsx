import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SearchResults } from './components/search-results'
import { SearchSummary } from './components/search-summary'
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
    routeId?: string
    date?: string
    passengers?: string
  }>
}

export default async function SearchResultsPage({ searchParams }: SearchResultsPageProps) {
  const params = await searchParams
  const { from, to, routeId, date, passengers } = params

  if (!from || !date || !passengers) {
    redirect('/')
  }

  const results = await getSearchResults({
    originId: from,
    destinationId: to,
    routeId: routeId,
    date: new Date(date),
    passengers: parseInt(passengers)
  })

  // Handle error case
  if (!results) {
    return (
      <PublicLayout>
        <div className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">Unable to load search results</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;re experiencing some issues. Please try again.
              </p>
              <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
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
      <div className="bg-background">
      <SearchSummary
        originId={from}
        destinationId={to}
        date={new Date(date)}
        passengers={parseInt(passengers)}
      />
      
      <div className="container mx-auto px-4 py-8">
        <SearchResults results={results} searchParams={params} />
      </div>
      </div>
    </PublicLayout>
  )
}