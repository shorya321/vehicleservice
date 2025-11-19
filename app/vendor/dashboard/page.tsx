import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireVendor } from "@/lib/auth/user-actions"
import { StatCard } from "@/components/ui/stat-card"
import {
  Users,
  Clock,
  ArrowRight,
  BarChart3,
  Activity,
  Shield,
  Car,
  Star,
  TrendingUp,
  Navigation,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { getVendorDashboardStats, getRecentBusinessActivities, getAnalyticsData } from "./actions"
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
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Business Profile Active
              </CardTitle>
              <CardDescription>
                Your business profile is set up and ready for vehicle listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/vendor/profile">
                  Edit Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles.toString()}
            description="Vehicles in fleet"
            icon={Car}
          />
          <StatCard
            title="Total Drivers"
            value={stats.totalDrivers.toString()}
            description="Active drivers"
            icon={Users}
          />
          <StatCard
            title="This Month Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            description="Completed bookings"
            icon={DollarSign}
          />
          <StatCard
            title="Average Rating"
            value={stats.hasRatings ? stats.averageRating.toFixed(1) : "N/A"}
            description={stats.hasRatings ? "Customer satisfaction" : "No reviews yet"}
            icon={Star}
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart data={analytics.revenueData} />
          <BookingGrowthChart data={analytics.bookingData} />
        </div>

        {/* Driver Performance */}
        <DriverPerformance data={analytics.driverPerformance} />

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Business Activities</CardTitle>
                <CardDescription>Latest updates in your business</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.action}</p>
                        <Badge
                          variant={
                            activity.type === "security" ? "default" :
                            activity.type === "driver" ? "secondary" :
                            activity.type === "vehicle" ? "outline" :
                            activity.type === "milestone" ? "default" : "outline"
                          }
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{activity.details}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your business</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="w-full justify-start">
              <Link href="/vendor/vehicles">
                <Car className="mr-2 h-4 w-4" />
                Manage Vehicles
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/vendor/bookings">
                <Navigation className="mr-2 h-4 w-4" />
                View Bookings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/vendor/drivers">
                <Users className="mr-2 h-4 w-4" />
                Manage Drivers
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/vendor/profile">
                <Activity className="mr-2 h-4 w-4" />
                Business Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}