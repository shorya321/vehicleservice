import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  FileText,
  Building2,
  UserPlus,
  Activity
} from "lucide-react"
import Link from "next/link"
import { cn, formatCurrency } from "@/lib/utils"
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
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
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Today's Revenue</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">
                    {formatCurrency(metrics.todayRevenue)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {metrics.revenueChange > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">+{metrics.revenueChange.toFixed(1)}%</span>
                    </>
                  ) : metrics.revenueChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{metrics.revenueChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No change</span>
                  )}
                  <span className="text-muted-foreground">from yesterday</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Active Bookings</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <Car className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                    {metrics.activeBookings}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">In progress today</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Pending Actions</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
                    {metrics.pendingActions}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Rejected</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400">
                    {metrics.rejectedBookings}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Need reassignment</p>
                {metrics.rejectedBookings > 0 && (
                  <Link href="/admin/bookings?status=rejected" className="text-xs text-primary hover:underline mt-1 inline-block">
                    View rejected →
                  </Link>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Completed Today</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                    <CheckCircle className="h-4 w-4 text-violet-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">
                    {metrics.completedBookingsToday}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Bookings completed</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-5 lg:gap-6 lg:grid-cols-12">
          {/* Left Column - Revenue & Bookings */}
          <div className="lg:col-span-8 space-y-5">
            {/* Revenue Chart */}
            <AnimatedCard delay={0.6}>
              <RevenueChart initialData={metrics.revenueTrend} />
            </AnimatedCard>

            {/* Recent Bookings - Timeline Style */}
            <AnimatedCard delay={0.7}>
              <Card className="admin-card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
                    <CardDescription className="mt-0.5">Latest booking activity</CardDescription>
                  </div>
                  <Link
                    href="/admin/bookings"
                    className="flex items-center gap-1.5 text-sm text-primary hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative pl-2">
                    {metrics.recentBookings.map((booking, index) => {
                      const isLast = index === metrics.recentBookings.length - 1
                      const statusDotClass =
                        booking.status === 'confirmed' || booking.status === 'completed'
                          ? 'admin-timeline-dot-confirmed'
                          : booking.status === 'pending'
                            ? 'admin-timeline-dot-pending'
                            : 'admin-timeline-dot-cancelled'

                      return (
                        <div key={booking.id} className="relative">
                          {!isLast && <div className="admin-timeline-line" />}

                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="group flex items-start gap-4 p-4 pr-5 rounded-lg transition-all duration-200 hover:bg-muted/50"
                          >
                            <div className="relative flex-shrink-0 mt-1.5">
                              <div className={cn("admin-timeline-dot", statusDotClass)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                  {booking.bookingNumber}
                                </span>
                                <Badge
                                  variant={
                                    booking.status === 'confirmed' ? 'success' :
                                    booking.status === 'completed' ? 'success' :
                                    booking.status === 'cancelled' ? 'destructive' :
                                    'warning'
                                  }
                                  className="text-xs"
                                >
                                  {booking.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                {booking.customerName}
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                {booking.route}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">{booking.time}</p>
                            </div>

                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(booking.amount)}
                              </span>
                              <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                    {metrics.recentBookings.length === 0 && (
                      <div className="p-5">
                        <EmptyState
                          icon={Car}
                          title="No Recent Bookings"
                          description="There are no bookings to display at this time."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>

          {/* Right Column - Stats & Alerts */}
          <div className="lg:col-span-4 space-y-5">
            {/* Operations Card */}
            <AnimatedCard delay={0.6}>
              <Card className="admin-card-hover">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">Operations</CardTitle>
                  </div>
                  <CardDescription className="mt-0.5">Current status</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">Active Users</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{metrics.availableUsers}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Building2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Active Vendors</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{metrics.activeVendors}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                        <Truck className="h-4 w-4 text-sky-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Available Vehicles</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{metrics.availableVehicles}</span>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Recent Activities */}
            <AnimatedCard delay={0.7}>
              <Card className="admin-card-hover">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
                  </div>
                  <CardDescription className="mt-0.5">Latest system activity</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-3 max-h-80 overflow-y-auto admin-scrollbar">
                    {metrics.recentActivities.map((activity) => {
                      const getActivityIcon = (type: string) => {
                        switch (type) {
                          case 'booking_created':
                            return <FileText className="h-4 w-4 text-sky-500" />
                          case 'vendor_application':
                            return <Building2 className="h-4 w-4 text-orange-500" />
                          case 'vehicle_added':
                            return <Truck className="h-4 w-4 text-emerald-500" />
                          case 'user_registered':
                            return <UserPlus className="h-4 w-4 text-violet-500" />
                          default:
                            return <Activity className="h-4 w-4 text-muted-foreground" />
                        }
                      }

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
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
                            <p className="text-xs text-muted-foreground/70 mt-1">
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
              <Card className="admin-card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2">
                  <Link href="/admin/bookings" className="admin-quick-action">
                    <span className="text-sm font-medium text-foreground">View All Bookings</span>
                    <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
                  </Link>
                  <Link href="/admin/vendor-applications" className="admin-quick-action">
                    <span className="text-sm font-medium text-foreground">Manage Vendors</span>
                    <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
                  </Link>
                  <Link href="/admin/vehicles" className="admin-quick-action">
                    <span className="text-sm font-medium text-foreground">Fleet Status</span>
                    <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
                  </Link>
                  <Link href="/admin/settings" className="admin-quick-action">
                    <span className="text-sm font-medium text-foreground">System Settings</span>
                    <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
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