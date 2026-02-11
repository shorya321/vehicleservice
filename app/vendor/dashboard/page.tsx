import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireVendor } from "@/lib/auth/user-actions"
import {
  Users,
  Clock,
  ArrowRight,
  Activity,
  Shield,
  Car,
  Star,
  Navigation,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { getVendorDashboardStats, getRecentBusinessActivities, getAnalyticsData, getVendorRevenueTrend, getVendorBookingTrend } from "./actions"
import { RevenueChart } from "./components/revenue-chart"
import { BookingGrowthChart } from "./components/booking-growth-chart"
import { DriverPerformance } from "./components/driver-performance"

export default async function VendorDashboard() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application data (which serves as business profile)
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name, status')
    .eq('user_id', user.id)
    .single()

  // Fetch dashboard data
  const stats = await getVendorDashboardStats()
  const activities = await getRecentBusinessActivities()
  const analytics = await getAnalyticsData()

  // Fetch initial chart data with default 'daily' period
  const initialRevenueTrend = await getVendorRevenueTrend('daily')
  const initialBookingTrend = await getVendorBookingTrend('daily')

  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {vendorApplication?.business_name || user.profile?.full_name || 'Vendor'}! Here&apos;s your business overview.
          </p>
        </div>

        {/* Business Profile Status */}
        {vendorApplication && vendorApplication.status === 'approved' && (
          <Card className="admin-card-hover border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Business Profile Active</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your business profile is set up and ready for vehicle listings
                    </p>
                  </div>
                </div>
                <Link href="/vendor/profile" className="admin-quick-action max-w-fit">
                  <span className="text-sm font-medium text-foreground">Edit Profile</span>
                  <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Vehicles</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <Car className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">
                  {stats.totalVehicles}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Vehicles in fleet</p>
            </CardContent>
          </Card>

          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Drivers</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                  {stats.totalDrivers}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Active drivers</p>
            </CardContent>
          </Card>

          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">This Month Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
                  ${stats.monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Completed bookings</p>
            </CardContent>
          </Card>

          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                  <Star className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">
                  {stats.hasRatings ? stats.averageRating.toFixed(1) : "N/A"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.hasRatings ? "Customer satisfaction" : "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts - 12 column grid */}
        <div className="grid gap-5 lg:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <RevenueChart initialData={initialRevenueTrend} />
          </div>
          <div className="lg:col-span-6">
            <BookingGrowthChart initialData={initialBookingTrend} />
          </div>
        </div>

        {/* Driver Performance */}
        <DriverPerformance data={analytics.driverPerformance} />

        {/* Recent Activities */}
        <Card className="admin-card-hover">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Recent Business Activities</CardTitle>
            </div>
            <CardDescription className="mt-0.5">Latest updates in your business</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <Badge
                          variant={
                            activity.type === "security" ? "default" :
                            activity.type === "driver" ? "secondary" :
                            activity.type === "vehicle" ? "outline" :
                            activity.type === "milestone" ? "default" : "outline"
                          }
                          className="text-xs"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="admin-card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription className="mt-0.5">Manage your business</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/vendor/vehicles" className="admin-quick-action">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Manage Vehicles</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
            </Link>
            <Link href="/vendor/bookings" className="admin-quick-action">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">View Bookings</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
            </Link>
            <Link href="/vendor/drivers" className="admin-quick-action">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Manage Drivers</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
            </Link>
            <Link href="/vendor/profile" className="admin-quick-action">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Business Profile</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary admin-quick-action-arrow" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}