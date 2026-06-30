export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { ReviewCard } from '@/components/reviews/review-card'
import { ReviewStats } from '@/components/reviews/review-stats'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal } from 'lucide-react'
import { getApprovedReviews, getReviewStats } from './actions'

interface PageProps {
  searchParams: Promise<{
    page?: string
    sortBy?: string
    rating?: string
    search?: string
  }>
}

export const metadata: Metadata = {
  title: 'Customer Reviews - Infinia Transfers',
  description: 'Read what our customers say about their transfer experiences',
}

export default async function PublicReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const page = parseInt(params.page || '1')
  const sortBy = (params.sortBy as any) || 'newest'
  const rating = params.rating ? parseInt(params.rating) : undefined
  const search = params.search || ''

  // Get reviews
  const { data: reviews, total, totalPages } = await getApprovedReviews({
    page,
    sortBy,
    rating,
    search,
    limit: 12,
  })

  // Get stats
  const { data: stats } = await getReviewStats()

  return (
    <div className="min-h-screen bg-[var(--black-void)] py-12">
      <div className="luxury-container">
        {/* Header */}
        <div className="mb-8">
          <div className="w-10 h-px bg-[var(--gold)] mb-5" aria-hidden="true" />
          <p className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[var(--gold-text)] mb-4">
            What Our Customers Say
          </p>
          <h1 className="editorial-section-title--promoted">
            Customer Reviews
          </h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-xl [text-wrap:pretty]">
            Real experiences from our valued customers
          </p>
        </div>

        {/* Review Stats */}
        <div className="mb-12">
          <ReviewStats stats={stats} layout="horizontal" />
        </div>

        {/* Filters */}
        <Card className="p-6 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <form method="GET" className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <Input
                  type="text"
                  name="search"
                  placeholder="Search reviews..."
                  defaultValue={search}
                  className="pl-10 bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)] focus:border-[var(--gold)] text-[var(--text-primary)]"
                />
                <input type="hidden" name="page" value="1" />
                <input type="hidden" name="sortBy" value={sortBy} />
                {rating && <input type="hidden" name="rating" value={rating} />}
              </form>
            </div>

            {/* Rating Filter */}
            <div>
              <form method="GET">
                <Select name="rating" defaultValue={rating?.toString() || 'all'}>
                  <SelectTrigger className="bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)]">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                    <SelectItem value="1">1+ Stars</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="page" value="1" />
                <input type="hidden" name="sortBy" value={sortBy} />
                {search && <input type="hidden" name="search" value={search} />}
              </form>
            </div>

            {/* Sort */}
            <div>
              <form method="GET">
                <Select name="sortBy" defaultValue={sortBy}>
                  <SelectTrigger className="bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                    <SelectItem value="helpful">Most Helpful</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="page" value="1" />
                {rating && <input type="hidden" name="rating" value={rating} />}
                {search && <input type="hidden" name="search" value={search} />}
              </form>
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[0.875rem] text-[var(--text-secondary)]">
            Showing {reviews?.length || 0} of {total} reviews
          </p>
          <p className="text-[0.875rem] text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </p>
        </div>

        {/* Reviews Grid */}
        {!reviews || reviews.length === 0 ? (
          <Card className="p-12 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)] text-center">
            <SlidersHorizontal className="w-16 h-16 text-[rgba(var(--gold-rgb),0.3)] mx-auto mb-4" />
            <h3 className="t-title mb-2">No reviews found</h3>
            <p className="text-[0.9375rem] text-[var(--text-secondary)] mb-6">
              Try adjusting your filters to see more results
            </p>
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
