'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, UserCheck } from "lucide-react"

export interface DriverPerformanceData {
  driverId: string
  driverName: string
  completedBookings: number
  completionRate: number
  averageRating: number
  hasRatings: boolean
}

interface DriverPerformanceProps {
  data: DriverPerformanceData[]
}

export function DriverPerformance({ data }: DriverPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-600" />
          <CardTitle>Driver Performance</CardTitle>
        </div>
        <CardDescription>
          Top performing drivers based on completed bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((driver) => (
                  <TableRow key={driver.driverId}>
                    <TableCell className="font-medium">{driver.driverName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{driver.completedBookings}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">
                        {driver.completionRate.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {driver.hasRatings ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {driver.averageRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <UserCheck className="h-12 w-12 mb-2 opacity-50" />
            <p>No driver performance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
