import Link from 'next/link'
import { requireCustomer } from '@/lib/auth/user-actions'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Plus, CheckCircle, Clock } from 'lucide-react'
import { getMyReviews, getCustomerReviewStats, getEligibleBookings } from './actions'
import { CustomerReviewFilters } from './components/customer-review-filters'
import { ReviewsTableWrapper } from './components/reviews-table-wrapper'

interface PageProps {
  searchParams: Promise<{
    page?: string
    status?: string
    sortBy?: string
    rating?: string
    ratingRange?: string
    search?: string
  }>
}

export const metadata = {
  title: 'My Reviews - Infinia Transfers',
  description: 'Manage your reviews and feedback',
}

export const dynamic = 'force-dynamic'

export default async function MyReviewsPage({ searchParams }: PageProps) {
  // Get authenticated user
  const user = await requireCustomer()

  const params = await searchParams

  const page = parseInt(params.page || '1')
  const status = (params.status as any) || 'all'
  const sortBy = (params.sortBy as any) || 'newest'
  const rating = params.rating ? parseInt(params.rating) : undefined
  const ratingRange = (params.ratingRange as any) || 'all'
  const search = params.search || ''

  // Get reviews with filters
  const { data: reviews, total, totalPages } = await getMyReviews({
    page,
    status,
    sortBy,
    rating,
    ratingRange,
    search,
    limit: 20,
  })

  // Get statistics
  const { data: stats } = await getCustomerReviewStats()

  // Get eligible bookings (for CTA)
  const { data: eligibleBookings } = await getEligibleBookings()
  const hasEligibleBookings = (eligibleBookings?.length || 0) > 0

  return (
    <CustomerLayout user={user}>
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'My Reviews', href: '/customer/reviews' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Reviews
            </h1>
            <p className="text-muted-foreground">Manage your reviews and feedback</p>
          </div>
          {hasEligibleBookings && eligibleBookings && (
            <Link href={`/customer/reviews/create?bookingId=${eligibleBookings[0].id}`}>
              <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black gap-2">
                <Plus className="h-4 w-4" />
                Write Review
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnimatedCard delay={0.1}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Reviews
                  </CardTitle>
                  <Star className="h-4 w-4 text-luxury-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Approval
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approved Reviews
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.approved}</div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Rating
                  </CardTitle>
                  <Star className="h-4 w-4 text-luxury-gold fill-luxury-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.averageRating.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        )}

        {/* Eligible Bookings CTA */}
        {hasEligibleBookings && eligibleBookings && (
          <AnimatedCard delay={0.5}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {eligibleBookings.length} {eligibleBookings.length === 1 ? 'Booking' : 'Bookings'} Ready for Review
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Share your experience and help other customers
                    </p>
                  </div>
                  <Link href={`/customer/reviews/create?bookingId=${eligibleBookings[0].id}`}>
                    <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black gap-2">
                      <Plus className="h-4 w-4" />
                      Write Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {/* Main Content */}
        <AnimatedCard delay={0.6}>
          <Card>
            <CardHeader>
              <CardTitle>All My Reviews</CardTitle>
              <CardDescription>
                View and manage all your reviews - {total} total reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <CustomerReviewFilters />

              {/* Results Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Showing {reviews?.length || 0} of {total} reviews
                </p>
                <p>
                  Page {page} of {totalPages}
                </p>
              </div>

              {/* Reviews Table with Bulk Actions */}
              <ReviewsTableWrapper reviews={reviews || []} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Link
                      href={`/customer/reviews?page=${page - 1}&status=${status}&sortBy=${sortBy}${ratingRange && ratingRange !== 'all' ? `&ratingRange=${ratingRange}` : ''}${search ? `&search=${search}` : ''}`}
                    >
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}

                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>

                  {page < totalPages && (
                    <Link
                      href={`/customer/reviews?page=${page + 1}&status=${status}&sortBy=${sortBy}${ratingRange && ratingRange !== 'all' ? `&ratingRange=${ratingRange}` : ''}${search ? `&search=${search}` : ''}`}
                    >
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      </AnimatedPage>
    </CustomerLayout>
  )
}
