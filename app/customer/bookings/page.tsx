import { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCustomer } from '@/lib/auth/user-actions'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { BookingsTable } from '@/components/bookings/bookings-table'
import { BookingFilters } from '@/components/bookings/booking-filters'
import { ClientFilters } from './components/client-filters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, ArrowRight, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'My Bookings | View Your Transfer History',
  description: 'View and manage your transfer bookings',
}

export const dynamic = 'force-dynamic'

interface BookingsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentStatus?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }>
}

async function getBookings(
  userId: string, 
  filters: BookingFilters
) {
  const adminClient = createAdminClient()
  const limit = filters.limit || 10
  const page = filters.page || 1
  const offset = (page - 1) * limit

  let query = adminClient
    .from('bookings')
    .select(`
      *,
      vehicle_type:vehicle_types(name),
      booking_assignments (
        status,
        vendor:vendor_applications (
          business_name
        ),
        driver:vendor_drivers (
          first_name,
          last_name
        )
      )
    `, { count: 'exact' })
    .eq('customer_id', userId)

  // Apply search filter
  if (filters.search) {
    query = query.or(
      `booking_number.ilike.%${filters.search}%,` +
      `pickup_address.ilike.%${filters.search}%,` +
      `dropoff_address.ilike.%${filters.search}%`
    )
  }

  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query = query.eq('booking_status', filters.status)
  }

  // Apply payment status filter
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  // Apply date range filter
  if (filters.dateFrom) {
    query = query.gte('pickup_datetime', filters.dateFrom.toISOString())
  }
  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte('pickup_datetime', endOfDay.toISOString())
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: bookings, count } = await query

  return {
    bookings: bookings || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

async function getBookingStats(userId: string) {
  const adminClient = createAdminClient()

  // Get total bookings
  const { count: totalBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', userId)

  // Get upcoming bookings
  const { count: upcomingBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', userId)
    .eq('booking_status', 'confirmed')
    .gte('pickup_datetime', new Date().toISOString())

  // Get completed bookings
  const { count: completedBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', userId)
    .eq('booking_status', 'completed')

  // Get cancelled bookings  
  const { count: cancelledBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', userId)
    .eq('booking_status', 'cancelled')

  return {
    total: totalBookings || 0,
    upcoming: upcomingBookings || 0,
    completed: completedBookings || 0,
    cancelled: cancelledBookings || 0
  }
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const user = await requireCustomer()
  const params = await searchParams

  const filters: BookingFilters = {
    search: params.search,
    status: (params.status as BookingFilters['status']) || 'all',
    paymentStatus: (params.paymentStatus as BookingFilters['paymentStatus']) || 'all',
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
  }

  const { bookings, total, page, totalPages } = await getBookings(user.id, filters)
  const stats = await getBookingStats(user.id)

  return (
    <CustomerLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage all your transfer bookings
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              View and manage your transfer bookings
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
                        pathname: "/customer/bookings",
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
                        pathname: "/customer/bookings",
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

            {/* Empty State */}
            {bookings.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.status !== 'all' || filters.paymentStatus !== 'all' || filters.dateFrom || filters.dateTo
                    ? 'Try adjusting your filters'
                    : 'Book a transfer to get started with your journey'}
                </p>
                {!filters.search && filters.status === 'all' && filters.paymentStatus === 'all' && !filters.dateFrom && !filters.dateTo && (
                  <Button asChild>
                    <Link href="/">
                      Book a Transfer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  )
}