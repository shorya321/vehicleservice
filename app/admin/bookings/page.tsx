import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { BookingsTable } from './components/bookings-table'
import { ClientFilters } from './components/client-filters'
import { getBookings, getBookingStats, BookingFilters } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Car, CheckCircle, XCircle, DollarSign, TrendingUp, FileDown } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Bookings Management - Admin',
  description: 'Manage all customer bookings',
}

export const dynamic = 'force-dynamic'

interface BookingsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentStatus?: string
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
    <AdminLayout>
      <div className="space-y-6">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
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
      </div>
    </AdminLayout>
  )
}