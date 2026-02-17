import { Metadata } from 'next'
import { BookingsTable } from './components/bookings-table'
import { ClientFilters } from './components/client-filters'
import { getBookings, getBookingStats, BookingFilters } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Car, CheckCircle, XCircle, DollarSign, TrendingUp, FileDown } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'

export const metadata: Metadata = {
  title: 'Bookings Management - Admin',
  description: 'Manage all customer bookings',
}

interface BookingsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentStatus?: string
    bookingType?: string
    vehicleTypeId?: string
    dateFrom?: string
    dateTo?: string
    customerId?: string
    page?: string
  }>
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams

  const filters: BookingFilters = {
    search: params.search,
    status: (params.status as BookingFilters['status']) || 'all',
    paymentStatus: (params.paymentStatus as BookingFilters['paymentStatus']) || 'all',
    bookingType: (params.bookingType as BookingFilters['bookingType']) || 'all',
    vehicleTypeId: params.vehicleTypeId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    customerId: params.customerId,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
  }

  const { bookings, total, page, totalPages } = await getBookings(filters)
  const stats = await getBookingStats()

  return (
      <AnimatedPage>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Bookings', href: '/admin/bookings' }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookings Management</h1>
            <p className="text-muted-foreground">
              View and manage all customer bookings
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <Car className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{stats.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All bookings</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Today&apos;s Bookings</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{stats.today}</span>
                </div>
                <p className="text-xs text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.upcoming}</span>
                </div>
                <p className="text-xs text-muted-foreground">Future bookings</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Completed</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{stats.completed}</span>
                </div>
                <p className="text-xs text-muted-foreground">Successfully done</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Cancelled</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400">{stats.cancelled}</span>
                </div>
                <p className="text-xs text-muted-foreground">Cancelled bookings</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.6}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{formatCurrency(stats.revenue)}</span>
                </div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        {/* Bookings Table */}
        <AnimatedCard delay={0.7}>
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              Manage customer bookings and track payment status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <ClientFilters initialFilters={filters} />
            
            {/* Table */}
            <BookingsTable bookings={bookings} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * filters.limit!) + 1} to{" "}
                  {Math.min(page * filters.limit!, total)} of {total} bookings
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/bookings",
                        query: {
                          ...params,
                          page: page - 1,
                        },
                      }}
                    >
                      Previous
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/bookings",
                        query: {
                          ...params,
                          page: page + 1,
                        },
                      }}
                    >
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedCard>
      </AnimatedPage>
  )
}