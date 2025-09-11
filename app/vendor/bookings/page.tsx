import { Metadata } from 'next'
import { VendorLayout } from '@/components/layout/vendor-layout'
import { requireVendor } from '@/lib/auth/user-actions'
import { getVendorAssignedBookings } from './actions'
import { BookingsTable } from './components/bookings-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, CheckCircle, Clock, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Assigned Bookings - Vendor',
  description: 'Manage your assigned bookings',
}

export const dynamic = 'force-dynamic'

export default async function VendorBookingsPage() {
  await requireVendor()
  const bookings = await getVendorAssignedBookings()
  
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
    <VendorLayout>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              {stats.pending > 0 && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Action required
                </Badge>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Pickups</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>
        </div>
        
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