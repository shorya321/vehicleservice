export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { ReviewCard } from '@/components/reviews/review-card'
import { ReviewStats } from '@/components/reviews/review-stats'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SlidersHorizontal, Star } from 'lucide-react'
import { ReviewFilters } from '@/components/reviews/review-filters'
import { SORT_VALUES, type ReviewSortValue } from '@/lib/reviews/filter-options'
import { getApprovedReviews, getReviewStats } from './actions'
import { buildEntityMetadata } from '@/lib/seo/page-metadata'
import { listCanonical } from '@/lib/seo/list-canonical'
import { devSampleReviewsPage } from '@/lib/reviews/dev-sample-preview'

const PAGE_SIZE = 12

interface PageProps {
  searchParams: Promise<{
    page?: string
    sortBy?: string
    rating?: string
    search?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { page } = await searchParams
  return buildEntityMetadata({
    path: listCanonical('/reviews', page),
    title: 'Customer Reviews',
    description: 'Read what our customers say about their transfer experiences',
  })
}

export default async function PublicReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Anything unexpected in the address falls back to the default instead of
  // failing validation and showing an empty list.
  const parsedPage = parseInt(params.page || '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const sortBy = params.sortBy && SORT_VALUES.includes(params.sortBy) ? (params.sortBy as ReviewSortValue) : 'newest'
  const parsedRating = params.rating ? parseInt(params.rating, 10) : NaN
  const rating = parsedRating >= 1 && parsedRating <= 5 ? parsedRating : undefined
  const search = (params.search || '').slice(0, 100)
  // Only a rating or a search narrows the list; sorting never hides a review.
  const hasFilters = Boolean(rating) || search.trim() !== ''

  const filters = { page, sortBy, rating, search, limit: PAGE_SIZE }
  const [realPage, { data: realStats }] = await Promise.all([getApprovedReviews(filters), getReviewStats()])

  // Dev server only, while the database holds no review: sample copy, matching
  // the home record. Production builds always read the database.
  const sample = devSampleReviewsPage(filters, realStats, process.env.NODE_ENV)
  const reviews = sample ? sample.data : realPage.data
  const total = sample ? sample.total : realPage.total
  const totalPages = sample ? sample.totalPages : realPage.totalPages
  const stats = sample ? sample.stats : realStats

  return (
    <div className="min-h-screen bg-[var(--black-void)] py-12">
      <div className="luxury-container">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-4">
            What Our Customers Say
          </p>
          <h1 className="editorial-section-title">
            Customer Reviews
          </h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-xl [text-wrap:pretty]">
            Reviews from travellers who booked a transfer with us.
          </p>
        </div>

        {/* Review Stats: a "0.0" with empty bars reads as a broken page. */}
        {stats && stats.totalReviews > 0 && (
          <div className="mb-12">
            <ReviewStats stats={stats} layout="horizontal" />
          </div>
        )}

        {/* Filters: nothing to narrow until there is a review, unless one is already set. */}
        {(total > 0 || hasFilters) && (
          <Card className="p-6 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)] mb-8">
            <ReviewFilters key={`${search}|${rating ?? ''}|${sortBy}`} search={search} rating={rating} sortBy={sortBy} />
          </Card>
        )}

        {/* Results Info. Hidden with nothing to count, which would read "Page 1 of 0". */}
        {total > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[0.875rem] text-[var(--text-secondary)]">
            Showing {reviews?.length || 0} of {total} reviews
          </p>
          <p className="text-[0.875rem] text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </p>
        </div>
        )}

        {/* Reviews Grid */}
        {!reviews || reviews.length === 0 ? (
          <Card className="p-12 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)] text-center">
            {hasFilters ? (
              <SlidersHorizontal className="w-16 h-16 text-[rgba(var(--gold-rgb),0.3)] mx-auto mb-4" />
            ) : (
              <Star className="w-16 h-16 text-[rgba(var(--gold-rgb),0.3)] mx-auto mb-4" />
            )}
            {hasFilters ? (
              <>
                <h3 className="t-title mb-2">No reviews found</h3>
                <p className="mx-auto max-w-md text-[0.9375rem] text-[var(--text-secondary)] mb-6">
                  Try adjusting your filters to see more results
                </p>
              </>
            ) : (
              <>
                <h3 className="t-title mb-2">No reviews yet</h3>
                <p className="mx-auto max-w-md text-[0.9375rem] text-[var(--text-secondary)] mb-6">
                  Reviews from travellers appear here after their trip.
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="space-y-6 mb-12">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review as any}
                variant="featured"
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <a
                href={`/reviews?page=${page - 1}&sortBy=${sortBy}${rating ? `&rating=${rating}` : ''}${search ? `&search=${search}` : ''}`}
              >
                <Button variant="outline">Previous</Button>
              </a>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <a
                    key={pageNum}
                    href={`/reviews?page=${pageNum}&sortBy=${sortBy}${rating ? `&rating=${rating}` : ''}${search ? `&search=${search}` : ''}`}
                  >
                    <Button variant={page === pageNum ? 'default' : 'outline'} size="sm">
                      {pageNum}
                    </Button>
                  </a>
                )
              })}
            </div>

            {page < totalPages && (
              <a
                href={`/reviews?page=${page + 1}&sortBy=${sortBy}${rating ? `&rating=${rating}` : ''}${search ? `&search=${search}` : ''}`}
              >
                <Button variant="outline">Next</Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
