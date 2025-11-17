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
import { EmptyState } from '@/components/ui/empty-state'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'

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
      <AnimatedPage>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-luxury-pearl">Dashboard</h1>
            <p className="text-luxury-lightGray">
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
          <AnimatedCard delay={0.1}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-luxury-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-luxury-pearl">{formatCurrency(metrics.todayRevenue)}</div>
                <p className="text-xs text-luxury-lightGray flex items-center mt-1">
                  {metrics.revenueChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-emerald-400 mr-1" />
                      <span className="text-emerald-400">+{metrics.revenueChange.toFixed(1)}%</span>
                    </>
                  ) : metrics.revenueChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
                      <span className="text-red-400">{metrics.revenueChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1">from yesterday</span>
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <Car className="h-4 w-4 text-luxury-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-luxury-pearl">{metrics.activeBookings}</div>
                <p className="text-xs text-luxury-lightGray">In progress today</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-luxury-goldLight" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-luxury-pearl">{metrics.pendingActions}</div>
                <p className="text-xs text-luxury-lightGray">Need attention</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-luxury-pearl">{metrics.rejectedBookings}</div>
                <p className="text-xs text-luxury-lightGray">Need reassignment</p>
                {metrics.rejectedBookings > 0 && (
                  <Link href="/admin/bookings?status=rejected" className="text-xs text-luxury-gold hover:underline mt-1 inline-block">
                    View rejected →
                  </Link>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-luxury-pearl">{metrics.completedBookingsToday}</div>
                <p className="text-xs text-luxury-lightGray">Bookings completed</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Revenue & Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <AnimatedCard delay={0.6}>
              <RevenueChart initialData={metrics.revenueTrend} />
            </AnimatedCard>

            {/* Recent Bookings Table */}
            <AnimatedCard delay={0.7}>
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription className="text-luxury-lightGray">Latest booking activity</CardDescription>
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
                      className="flex items-center justify-between border-b border-luxury-gold/20 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-medium text-sm text-luxury-pearl hover:text-luxury-gold hover:underline transition-colors"
                          >
                            {booking.bookingNumber}
                          </Link>
                          <Badge
                            variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'completed' ? 'success' :
                              booking.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-luxury-lightGray mt-1">
                          {booking.customerName} • {booking.route}
                        </p>
                        <p className="text-xs text-luxury-lightGray/70">
                          {booking.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-luxury-pearl">
                          {formatCurrency(booking.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {metrics.recentBookings.length === 0 && (
                    <EmptyState
                      icon={Car}
                      title="No Recent Bookings"
                      description="There are no bookings to display at this time."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>
          </div>

          {/* Right Column - Stats & Alerts */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <AnimatedCard delay={0.6}>
              <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
                <CardDescription className="text-luxury-lightGray">Current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-luxury-gold" />
                    <span className="text-sm text-luxury-lightGray">Active Users</span>
                  </div>
                  <span className="font-medium text-luxury-pearl">{metrics.availableUsers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-luxury-gold" />
                    <span className="text-sm text-luxury-lightGray">Active Vendors</span>
                  </div>
                  <span className="font-medium text-luxury-pearl">{metrics.activeVendors}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-luxury-gold" />
                    <span className="text-sm text-luxury-lightGray">Available Vehicles</span>
                  </div>
                  <span className="font-medium text-luxury-pearl">{metrics.availableVehicles}</span>
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* Recent Activities */}
            <AnimatedCard delay={0.7}>
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-luxury-gold" />
                  Recent Activities
                </CardTitle>
                <CardDescription className="text-luxury-lightGray">Latest system activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto luxury-scrollbar">
                  {metrics.recentActivities.map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'booking_created':
                          return <FileText className="h-4 w-4 text-blue-400" />
                        case 'vendor_application':
                          return <Building2 className="h-4 w-4 text-orange-400" />
                        case 'vehicle_added':
                          return <Truck className="h-4 w-4 text-emerald-400" />
                        case 'user_registered':
                          return <UserPlus className="h-4 w-4 text-purple-400" />
                        default:
                          return <Activity className="h-4 w-4 text-luxury-lightGray" />
                      }
                    }

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-luxury-gold/5 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-luxury-pearl">
                            {activity.description}
                          </p>
                          {activity.userInfo && (
                            <p className="text-xs text-luxury-lightGray mt-0.5">
                              {activity.userInfo}
                            </p>
                          )}
                          <p className="text-xs text-luxury-lightGray/70 mt-1">
                            {activity.timeAgo}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {metrics.recentActivities.length === 0 && (
                    <EmptyState
                      icon={Activity}
                      title="No Recent Activities"
                      description="There are no activities to display at this time."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* Quick Actions */}
            <AnimatedCard delay={0.8}>
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
            </AnimatedCard>
          </div>
        </div>
      </AnimatedPage>
    </AdminLayout>
  )
}