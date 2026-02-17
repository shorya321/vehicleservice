import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Clock, CheckCircle } from 'lucide-react'
import { getReviews, getAdminReviewStats } from './actions'
import { ReviewsTable } from './components/reviews-table'
import { ReviewFilters } from './components/review-filters'
import { ReviewsTableWrapper } from './components/reviews-table-wrapper'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  title: 'Review Management - Infinia Transfers Admin',
  description: 'Manage customer reviews and feedback',
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  // Check authentication and authorization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/reviews')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/admin/dashboard')
  }

  const params = await searchParams

  const page = parseInt(params.page || '1')
  const status = (params.status as any) || 'all'
  const sortBy = (params.sortBy as any) || 'newest'
  const rating = params.rating ? parseInt(params.rating) : undefined
  const ratingRange = (params.ratingRange as any) || 'all'
  const search = params.search || ''

  // Get reviews
  const { data: reviews, total, totalPages } = await getReviews({
    page,
    status,
    sortBy,
    rating,
    ratingRange,
    search,
    limit: 20,
  })

  // Get statistics
  const { data: stats } = await getAdminReviewStats()

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Reviews', href: '/admin/reviews' }]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Review Management
            </h1>
            <p className="text-muted-foreground">Moderate and manage customer reviews</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AnimatedCard delay={0.1}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{stats.total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">All reviews</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Pending Approval</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.pending}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Need review</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                      <Star className="h-4 w-4 text-violet-500 fill-violet-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{stats.averageRating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Out of 5 stars</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">This Page</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{reviews?.length || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Showing now</p>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        )}

        {/* Main Content */}
        <AnimatedCard delay={0.5}>
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
              <CardDescription>
                Manage and moderate customer reviews - {total} total reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <ReviewFilters />

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
                      href={`/admin/reviews?page=${page - 1}&status=${status}&sortBy=${sortBy}${ratingRange && ratingRange !== 'all' ? `&ratingRange=${ratingRange}` : ''}${search ? `&search=${search}` : ''}`}
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
                      href={`/admin/reviews?page=${page + 1}&status=${status}&sortBy=${sortBy}${ratingRange && ratingRange !== 'all' ? `&ratingRange=${ratingRange}` : ''}${search ? `&search=${search}` : ''}`}
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
  )
}
