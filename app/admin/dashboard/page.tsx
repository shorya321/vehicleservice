import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  Car,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  Truck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Info,
  FileText,
  Building2,
  UserPlus,
  Activity
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { getDashboardMetrics } from './actions'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Fetch dashboard metrics
  const metrics = await getDashboardMetrics()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.todayRevenue)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {metrics.revenueChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600">+{metrics.revenueChange.toFixed(1)}%</span>
                  </>
                ) : metrics.revenueChange < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    <span className="text-red-600">{metrics.revenueChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <span>No change</span>
                )}
                <span className="ml-1">from yesterday</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeBookings}</div>
              <p className="text-xs text-muted-foreground">In progress today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingActions}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.rejectedBookings}</div>
              <p className="text-xs text-muted-foreground">Need reassignment</p>
              {metrics.rejectedBookings > 0 && (
                <Link href="/admin/bookings?status=rejected" className="text-xs text-primary hover:underline mt-1 inline-block">
                  View rejected →
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedBookingsToday}</div>
              <p className="text-xs text-muted-foreground">Bookings completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Revenue & Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <RevenueChart initialData={metrics.revenueTrend} />

            {/* Recent Bookings Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking activity</CardDescription>
                </div>
                <Link href="/admin/bookings">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {booking.bookingNumber}
                          </Link>
                          <Badge
                            variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'completed' ? 'secondary' :
                              booking.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.customerName} • {booking.route}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(booking.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {metrics.recentBookings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent bookings
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Alerts */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
                <CardDescription>Current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Users</span>
                  </div>
                  <span className="font-medium">{metrics.availableUsers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Vendors</span>
                  </div>
                  <span className="font-medium">{metrics.activeVendors}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Available Vehicles</span>
                  </div>
                  <span className="font-medium">{metrics.availableVehicles}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest system activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {metrics.recentActivities.map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'booking_created':
                          return <FileText className="h-4 w-4 text-blue-600" />
                        case 'vendor_application':
                          return <Building2 className="h-4 w-4 text-orange-600" />
                        case 'vehicle_added':
                          return <Truck className="h-4 w-4 text-green-600" />
                        case 'user_registered':
                          return <UserPlus className="h-4 w-4 text-purple-600" />
                        default:
                          return <Activity className="h-4 w-4 text-gray-600" />
                      }
                    }

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {activity.description}
                          </p>
                          {activity.userInfo && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {activity.userInfo}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.timeAgo}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {metrics.recentActivities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activities
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/bookings" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>View All Bookings</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/vendor-applications" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>Manage Vendors</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/vehicles" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    <span>Fleet Status</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}