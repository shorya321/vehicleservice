import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DriverLayout } from "@/components/layout/driver-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireDriver } from "@/lib/auth/user-actions"
import { StatCard } from "@/components/ui/stat-card"
import {
  Calendar,
  DollarSign,
  Car,
  Clock,
  TrendingUp,
  MapPin,
  ArrowRight,
  Activity,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const todaysTrips = [
  {
    id: "1",
    customer: "Sarah Johnson",
    service: "Airport Transfer",
    pickup: "Hilton Hotel",
    dropoff: "International Airport",
    time: "10:00 AM",
    status: "upcoming",
    fare: "$85",
  },
  {
    id: "2",
    customer: "Ahmed Ali",
    service: "Desert Safari",
    pickup: "City Center Mall",
    dropoff: "Desert Camp Site",
    time: "4:00 PM",
    status: "assigned",
    fare: "$120",
  },
]

const recentTrips = [
  {
    id: "3",
    date: "Yesterday",
    trips: 5,
    earnings: "$245",
    hours: "8.5",
  },
  {
    id: "4",
    date: "Jun 20",
    trips: 4,
    earnings: "$198",
    hours: "7.2",
  },
]

export default async function DriverDashboard() {
  const user = await requireDriver()
  
  return (
    <DriverLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Driver Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user.profile?.full_name || 'Driver'}! Here's your daily overview.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Earnings"
            value="$156"
            description="From 3 completed trips"
            icon={DollarSign}
            trend={{ value: 18.5, isPositive: true }}
          />
          <StatCard
            title="Weekly Earnings"
            value="$1,245"
            description="This week total"
            icon={TrendingUp}
            trend={{ value: 12.3, isPositive: true }}
          />
          <StatCard
            title="Total Trips"
            value="23"
            description="This week"
            icon={Car}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Hours Online"
            value="42.5"
            description="This week"
            icon={Clock}
            trend={{ value: 8.2, isPositive: true }}
          />
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Trips</CardTitle>
                <CardDescription>Your assigned trips for today</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/driver/trips">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{trip.customer}</p>
                      <Badge
                        variant={
                          trip.status === "upcoming" ? "default" : "secondary"
                        }
                      >
                        {trip.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {trip.service}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{trip.pickup} → {trip.dropoff}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trip.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{trip.fare}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance & Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance</CardTitle>
              <CardDescription>Your trip history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrips.map((day) => (
                  <div key={day.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.trips} trips • {day.hours} hours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{day.earnings}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(parseFloat(day.earnings.slice(1)) / parseFloat(day.hours)).toFixed(2)}/hour
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your work</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Available
                </Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/driver/trips">
                  <Car className="mr-2 h-4 w-4" />
                  View Today's Trips
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/driver/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  My Schedule
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/driver/earnings">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Earnings Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Important updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New trip assigned</p>
                  <p className="text-xs text-muted-foreground">Airport transfer scheduled for tomorrow 8:00 AM</p>
                </div>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Weekly earnings deposited</p>
                  <p className="text-xs text-muted-foreground">$1,156 has been transferred to your account</p>
                </div>
                <span className="text-xs text-muted-foreground">Yesterday</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Schedule reminder</p>
                  <p className="text-xs text-muted-foreground">You have 2 trips scheduled for tomorrow</p>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  )
}