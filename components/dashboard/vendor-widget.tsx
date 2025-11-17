'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Building, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { VendorMetrics } from '@/app/admin/dashboard/actions'

interface VendorWidgetProps {
  data: VendorMetrics
}

export function VendorWidget({ data }: VendorWidgetProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeVendors}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingApplications} pending applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.acceptanceRate.toFixed(1)}%</div>
            <Progress value={data.acceptanceRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageResponseTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              To accept assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting vendor response
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Vendors</CardTitle>
          <CardDescription>Based on completed bookings and acceptance rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topVendors.map((vendor, index) => (
              <div key={vendor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{vendor.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.completedBookings} completed bookings
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {vendor.acceptanceRate.toFixed(0)}% acceptance
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}