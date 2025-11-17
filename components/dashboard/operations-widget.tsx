'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Car, Users, AlertTriangle, XCircle, MapPin, Activity } from 'lucide-react'
import { OperationalMetrics } from '@/app/admin/dashboard/actions'

interface OperationsWidgetProps {
  data: OperationalMetrics
}

export function OperationsWidget({ data }: OperationsWidgetProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeTrips}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers on Duty</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.driversOnDuty}</div>
            <p className="text-xs text-muted-foreground">
              Available drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting vendor response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Operations Center</CardTitle>
          <CardDescription>Live operational status and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pendingAssignments > 5 && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <strong>High pending assignments:</strong> {data.pendingAssignments} bookings are awaiting vendor assignment.
                Consider reaching out to available vendors.
              </AlertDescription>
            </Alert>
          )}

          {data.driversOnDuty < 5 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <Users className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm">
                <strong>Low driver availability:</strong> Only {data.driversOnDuty} drivers are currently on duty.
                This may affect service capacity.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Recent Cancellations
            </h4>
            {data.recentCancellations.length > 0 ? (
              <div className="space-y-2">
                {data.recentCancellations.map((cancellation) => (
                  <div
                    key={cancellation.id}
                    className="flex items-center justify-between p-2 border rounded-lg bg-card"
                  >
                    <div>
                      <p className="text-sm font-medium">{cancellation.bookingNumber}</p>
                      <p className="text-xs text-muted-foreground">{cancellation.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(cancellation.cancelledAt).toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent cancellations</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold">{data.activeTrips}</div>
              <p className="text-xs text-muted-foreground">Active Trips</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.driversOnDuty}</div>
              <p className="text-xs text-muted-foreground">Drivers Available</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.pendingAssignments}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}