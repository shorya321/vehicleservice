'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MapPin, Car, Users, TrendingUp, Truck, Search } from 'lucide-react'
import { RouteMetrics, FleetMetrics, CustomerMetrics } from '@/app/admin/dashboard/actions'
import { formatCurrency } from '@/lib/utils'

export function RouteWidget({ data }: { data: RouteMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Routes</CardTitle>
        <CardDescription>Top performing routes by bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.popularRoutes.map((route, index) => (
            <div key={route.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{route.routeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.bookingCount} bookings
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCurrency(route.revenue)}</p>
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Search Trends (7 days)</h4>
          <div className="flex items-end justify-between gap-1 h-16">
            {data.searchTrends.map((item) => {
              const maxSearches = Math.max(...data.searchTrends.map(d => d.searches))
              const height = maxSearches > 0 ? (item.searches / maxSearches) * 100 : 0
              return (
                <div key={item.date} className="flex-1 flex flex-col justify-end">
                  <div
                    className="bg-primary/60 rounded-t hover:bg-primary transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${item.searches} searches on ${item.date}`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Top Searched Locations
          </h4>
          <div className="space-y-2">
            {data.topSearchedLocations.map((location) => (
              <div key={location.locationName} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{location.locationName}</span>
                <span className="font-medium">{location.searchCount} searches</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FleetWidget({ data }: { data: FleetMetrics }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {data.availableVehicles} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assignedVehicles}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.utilizationRate.toFixed(1)}%</div>
            <Progress value={data.utilizationRate} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet by Vehicle Type</CardTitle>
          <CardDescription>Distribution of vehicles across types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.vehiclesByType).map(([type, count]) => {
              const percentage = data.totalVehicles > 0 ? (count / data.totalVehicles) * 100 : 0
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{type}</span>
                    <span className="text-muted-foreground">{count} vehicles</span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function CustomerWidget({ data }: { data: CustomerMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Today</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.newCustomersToday}</div>
          <p className="text-xs text-muted-foreground">New signups</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.newCustomersWeek}</div>
          <p className="text-xs text-muted-foreground">New customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Active</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalActiveCustomers}</div>
          <p className="text-xs text-muted-foreground">Active customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repeat Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.repeatBookingRate.toFixed(1)}%</div>
          <Progress value={data.repeatBookingRate} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg LTV</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.averageLifetimeValue)}</div>
          <p className="text-xs text-muted-foreground">Per customer</p>
        </CardContent>
      </Card>
    </div>
  )
}