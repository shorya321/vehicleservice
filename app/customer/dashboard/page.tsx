import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireCustomer } from "@/lib/auth/user-actions"
import {
  Calendar,
  Car,
  CreditCard,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const upcomingBookings = [
  {
    id: "1",
    service: "Airport Transfer",
    date: "2024-06-25",
    time: "10:00 AM",
    vehicle: "Toyota Camry",
    driver: "John Smith",
    status: "confirmed",
    price: "$85",
  },
  {
    id: "2",
    service: "Desert Safari",
    date: "2024-06-28",
    time: "4:00 PM",
    vehicle: "Land Cruiser",
    driver: "Ahmed Ali",
    status: "pending",
    price: "$250",
  },
]

const recentBookings = [
  {
    id: "3",
    service: "City Tour",
    date: "2024-06-20",
    rating: 5,
    price: "$120",
  },
  {
    id: "4",
    service: "Private Transfer",
    date: "2024-06-15",
    rating: 4,
    price: "$95",
  },
]

export default async function CustomerDashboard() {
  const user = await requireCustomer()
  
  return (
    <CustomerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.profile?.full_name || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your bookings and activities
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Book a Service</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/customer/book">Book Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,245</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">Gold member</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your scheduled services</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/customer/bookings">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.service}</p>
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {booking.vehicle}
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

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your past services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{booking.service}</p>
                      <p className="text-sm text-muted-foreground">{booking.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(booking.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{booking.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Services</CardTitle>
              <CardDescription>Frequently booked by you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Airport Transfer</p>
                      <p className="text-sm text-muted-foreground">5 bookings</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Book Again
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">City Tour</p>
                      <p className="text-sm text-muted-foreground">3 bookings</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Book Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  )
}