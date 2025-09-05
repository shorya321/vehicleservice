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
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const recentActivities = [
  {
    id: "1",
    action: "Profile updated",
    details: "Business information updated",
    time: "2 hours ago",
    type: "update",
  },
  {
    id: "2",
    action: "New team member added",
    details: "John Smith joined as operator",
    time: "5 hours ago",
    type: "team",
  },
  {
    id: "3",
    action: "Security settings updated",
    details: "2FA enabled for all team members",
    time: "1 day ago",
    type: "security",
  },
]

export default async function VendorDashboard() {
  const user = await requireVendor()
  const supabase = await createClient()
  
  // Get vendor application data (which serves as business profile)
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name, status')
    .eq('user_id', user.id)
    .single()

  return (
    <VendorLayout>
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
            title="Active Vehicles"
            value="0"
            description="Vehicles available for booking"
            icon={Car}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Bookings"
            value="0"
            description="Bookings this month"
            icon={Navigation}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Average Rating"
            value="0.0"
            description="Customer satisfaction"
            icon={Star}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Revenue"
            value="$0"
            description="This month's earnings"
            icon={BarChart3}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest updates and actions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vendor/activities">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
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
                          activity.type === "team" ? "secondary" : "outline"
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
                  <div className="text-right">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Team activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Active Team Members</p>
                    <span className="text-sm text-muted-foreground">8 of 10 online</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Tasks Completed</p>
                    <span className="text-sm text-muted-foreground">45 today</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-green-500" style={{ width: "65%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Response Rate</p>
                    <span className="text-sm text-muted-foreground">95%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: "95%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your business</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button asChild className="w-full justify-start">
                <Link href="/vendor/vehicles">
                  <Car className="mr-2 h-4 w-4" />
                  Manage Vehicles
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/vendor/profile">
                  <Activity className="mr-2 h-4 w-4" />
                  Business Profile
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/vendor/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New booking received</p>
                  <p className="text-xs text-muted-foreground">John Doe booked Desert Safari for tomorrow</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                  <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New review received</p>
                  <p className="text-xs text-muted-foreground">5-star rating for City Tour service</p>
                </div>
                <span className="text-xs text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Weekly report available</p>
                  <p className="text-xs text-muted-foreground">Your earnings increased by 15% this week</p>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}