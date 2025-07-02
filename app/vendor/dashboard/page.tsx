import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireVendor } from "@/lib/auth/user-actions"
import { StatCard } from "@/components/ui/stat-card"
import {
  Calendar,
  DollarSign,
  Package,
  Star,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const todaysBookings = [
  {
    id: "1",
    customer: "John Doe",
    service: "Desert Safari Premium",
    time: "2:00 PM",
    status: "confirmed",
    price: "$250",
  },
  {
    id: "2",
    customer: "Jane Smith",
    service: "City Tour",
    time: "4:00 PM",
    status: "pending",
    price: "$120",
  },
]

const topServices = [
  { name: "Desert Safari Premium", bookings: 45, revenue: "$11,250", rating: 4.8 },
  { name: "City Tour", bookings: 32, revenue: "$3,840", rating: 4.6 },
  { name: "Airport Transfer", bookings: 28, revenue: "$2,380", rating: 4.9 },
]

export default async function VendorDashboard() {
  const user = await requireVendor()
  
  return (
    <VendorLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.profile?.full_name || 'Vendor'}! Here's your business overview.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Revenue"
            value="$15,231"
            description="Total earnings this month"
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Bookings"
            value="142"
            description="Bookings this month"
            icon={Calendar}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Active Services"
            value="12"
            description="Services offered"
            icon={Package}
            trend={{ value: 0, isPositive: true }}
          />
          <StatCard
            title="Average Rating"
            value="4.8"
            description="Customer satisfaction"
            icon={Star}
            trend={{ value: 2.1, isPositive: true }}
          />
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Bookings</CardTitle>
                <CardDescription>Your schedule for today</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/vendor/bookings">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.customer}</p>
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{booking.service}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{booking.price}</p>
                    <Button variant="outline" size="sm" className="mt-2">
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
              <CardTitle>Top Performing Services</CardTitle>
              <CardDescription>Your best services this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{service.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm">{service.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {service.bookings} bookings
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(service.bookings / 45) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-[80px] text-right">
                        {service.revenue}
                      </span>
                    </div>
                  </div>
                ))}
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
                <Link href="/vendor/services/new">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Service
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/vendor/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Bookings
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/vendor/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/vendor/earnings">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Check Earnings
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