import { redirect } from 'next/navigation'
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