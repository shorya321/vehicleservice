'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, Users, XCircle, Clock, CheckCircle, Activity } from 'lucide-react'
import { BookingMetrics } from '@/app/admin/dashboard/actions'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface BookingWidgetProps {
  data: BookingMetrics
}

export function BookingWidget({ data }: BookingWidgetProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    refunded: 'bg-gray-500',
  }

  const statusIcons: Record<string, any> = {
    pending: Clock,
    confirmed: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    refunded: XCircle,
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookingsToday}</div>
            <p className="text-xs text-muted-foreground">
              {data.upcomingBookings} upcoming in 24hrs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Bookings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBookingsWeek}</div>
            <p className="text-xs text-muted-foreground">
              {data.totalBookingsMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
            <Progress value={data.conversionRate} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Searches to bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cancellationRate.toFixed(1)}%</div>
            <Progress value={100 - data.cancellationRate} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {100 - data.cancellationRate > 95 ? 'Excellent' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
            <CardDescription>Current status of all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.bookingsByStatus).map(([status, count]) => {
                const total = Object.values(data.bookingsByStatus).reduce((sum, c) => sum + c, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                const Icon = statusIcons[status] || Activity

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{count}</span>
                        <Badge variant="outline" className="text-xs">
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${statusColors[status] || 'bg-gray-500'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {booking.bookingNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {booking.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.pickupDateTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                    <Badge
                      variant={
                        booking.status === 'confirmed'
                          ? 'default'
                          : booking.status === 'completed'
                          ? 'secondary'
                          : booking.status === 'cancelled'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="text-xs mt-1"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.recentBookings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent bookings
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}