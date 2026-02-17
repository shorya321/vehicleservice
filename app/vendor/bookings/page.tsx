import { Metadata } from 'next'
import { VendorLayout } from '@/components/layout/vendor-layout'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'
import { getVendorAssignedBookings } from './actions'
import { BookingsTable } from './components/bookings-table'
import { BookingFilters } from './components/booking-filters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, CheckCircle, Clock, XCircle } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'

export const metadata: Metadata = {
  title: 'Assigned Bookings - Vendor',
  description: 'Manage your assigned bookings',
}

interface VendorBookingsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    sortBy?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function VendorBookingsPage({ searchParams }: VendorBookingsPageProps) {
  const user = await requireVendor()
  const supabase = await createClient()
  const params = await searchParams

  // Get vendor application for business name
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name')
    .eq('user_id', user.id)
    .single()

  const filters = {
    search: params.search,
    status: params.status,
    sortBy: params.sortBy || 'newest',
    startDate: params.startDate,
    endDate: params.endDate,
  }

  const bookings = await getVendorAssignedBookings(filters)
  
  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    today: bookings.filter(b => {
      if (!b.booking || !b.booking.pickup_datetime) return false
      const pickupDate = new Date(b.booking.pickup_datetime)
      const today = new Date()
      return pickupDate.toDateString() === today.toDateString()
    }).length,
  }
  
  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assigned Bookings</h1>
          <p className="text-muted-foreground">
            Manage bookings assigned to you by the admin
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Assigned</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Car className="h-4 w-4 text-primary" />
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
                  <span className="text-sm font-medium text-muted-foreground">Pending</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.pending}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stats.pending > 0 ? 'Action required' : 'No pending'}</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Accepted</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{stats.accepted}</span>
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Completed</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <CheckCircle className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{stats.completed}</span>
                </div>
                <p className="text-xs text-muted-foreground">Successfully done</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Today&apos;s Pickups</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
                    <Calendar className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400">{stats.today}</span>
                </div>
                <p className="text-xs text-muted-foreground">Scheduled today</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Bookings</CardTitle>
            <CardDescription>
              Search and filter your assigned bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingFilters />
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Assigned Bookings</CardTitle>
            <CardDescription>
              Accept assignments and allocate drivers and vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsTable bookings={bookings} />
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}