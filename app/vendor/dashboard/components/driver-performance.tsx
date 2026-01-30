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
    <Card className="admin-card-hover">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <UserCheck className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Driver Performance</CardTitle>
            <CardDescription className="mt-0.5">Top performing drivers based on completed bookings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
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
