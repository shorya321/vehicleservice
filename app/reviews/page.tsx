export const dynamic = 'force-dynamic'

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

export const metadata = {
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
    <div className="min-h-screen bg-luxury-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-luxury-pearl font-playfair mb-4">
            Customer Reviews
          </h1>
          <p className="text-xl text-luxury-lightGray">
            Real experiences from our valued customers
          </p>
        </div>

        {/* Review Stats */}
        <div className="mb-12">
          <ReviewStats stats={stats} layout="horizontal" />
        </div>

        {/* Filters */}
        <Card className="p-6 bg-luxury-black/50 backdrop-blur-md border-luxury-lightGray/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <form method="GET" className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-lightGray/50" />
                <Input
                  type="text"
                  name="search"
                  placeholder="Search reviews..."
                  defaultValue={search}
                  className="pl-10 bg-luxury-black/30 border-luxury-lightGray/20 focus:border-luxury-gold text-luxury-pearl"
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
                  <SelectTrigger className="bg-luxury-black/30 border-luxury-lightGray/20">
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
                  <SelectTrigger className="bg-luxury-black/30 border-luxury-lightGray/20">
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
          <p className="text-luxury-lightGray">
            Showing {reviews?.length || 0} of {total} reviews
          </p>
          <p className="text-luxury-lightGray">
            Page {page} of {totalPages}
          </p>
        </div>

        {/* Reviews Grid */}
        {!reviews || reviews.length === 0 ? (
          <Card className="p-12 bg-luxury-black/50 backdrop-blur-md border-luxury-lightGray/10 text-center">
            <SlidersHorizontal className="w-16 h-16 text-luxury-gold/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-luxury-pearl mb-2">No reviews found</h3>
            <p className="text-luxury-lightGray mb-6">
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
