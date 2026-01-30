'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getVendorBookingTrend, type PeriodType } from '../actions'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp } from 'lucide-react'

interface BookingGrowthChartProps {
  initialData: Array<{
    date: string
    label: string
    bookings: number
  }>
}

export function BookingGrowthChart({ initialData }: BookingGrowthChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('daily')
  const [bookingTrend, setBookingTrend] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (period: PeriodType) => {
    if (period === selectedPeriod) return

    setSelectedPeriod(period)
    startTransition(async () => {
      const newData = await getVendorBookingTrend(period)
      setBookingTrend(newData)
    })
  }

  const getDateRangeLabel = () => {
    switch (selectedPeriod) {
      case 'daily':
        return 'Last 7 days performance'
      case 'weekly':
        return 'Last 8 weeks performance'
      case 'monthly':
        return 'Last 12 months performance'
    }
  }

  const maxBookings = Math.max(...bookingTrend.map(d => d.bookings))
  const totalBookings = bookingTrend.reduce((sum, d) => sum + d.bookings, 0)
  const hasAnyBookings = totalBookings > 0

  return (
    <Card className="admin-card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Booking Growth</CardTitle>
            <CardDescription className="mt-0.5">
              {getDateRangeLabel()}
              {hasAnyBookings && (
                <span className="ml-2 text-primary font-medium">
                  (Total: {totalBookings} booking{totalBookings !== 1 ? 's' : ''})
                </span>
              )}
            </CardDescription>
          </div>
        </div>
        <div className="admin-period-selector">
          <button
            className={cn(
              "admin-period-btn",
              selectedPeriod === 'daily' ? "admin-period-btn-active" : "admin-period-btn-inactive"
            )}
            onClick={() => handlePeriodChange('daily')}
            disabled={isPending}
          >
            Daily
          </button>
          <button
            className={cn(
              "admin-period-btn",
              selectedPeriod === 'weekly' ? "admin-period-btn-active" : "admin-period-btn-inactive"
            )}
            onClick={() => handlePeriodChange('weekly')}
            disabled={isPending}
          >
            Weekly
          </button>
          <button
            className={cn(
              "admin-period-btn",
              selectedPeriod === 'monthly' ? "admin-period-btn-active" : "admin-period-btn-inactive"
            )}
            onClick={() => handlePeriodChange('monthly')}
            disabled={isPending}
          >
            Monthly
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isPending ? (
          <div className="h-[200px] flex items-end justify-between gap-1">
            {Array.from({ length: selectedPeriod === 'daily' ? 7 : selectedPeriod === 'weekly' ? 8 : 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="h-[250px] relative">
            <div className="h-[200px] flex items-end justify-between gap-1 relative">
              {bookingTrend.map((item, index) => {
                // Calculate height with proper scaling
                const hasBookings = item.bookings > 0
                let barHeight = 0

                if (hasBookings && maxBookings > 0) {
                  // Scale from 20px minimum to 180px maximum
                  barHeight = 20 + ((item.bookings / maxBookings) * 160)
                } else if (!hasBookings) {
                  barHeight = 8 // Minimal height for empty bars
                }

                return (
                  <div
                    key={`${selectedPeriod}-${item.date}`}
                    className="flex-1 flex flex-col justify-end items-center group relative"
                  >
                    {/* Bar */}
                    <div
                      className={`
                        w-full
                        ${hasBookings
                          ? 'bg-primary hover:bg-primary/80'
                          : 'bg-primary/30 hover:bg-primary/50'}
                        rounded-t transition-all duration-200
                        relative
                      `}
                      style={{
                        height: `${barHeight}px`,
                        minHeight: '4px'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground border px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-md pointer-events-none">
                        <div className="font-semibold">{item.bookings > 0 ? `${item.bookings} booking${item.bookings !== 1 ? 's' : ''}` : 'No bookings'}</div>
                        <div className="text-xs opacity-75">{item.label}</div>
                      </div>
                    </div>

                    {/* Label below bar */}
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {!isPending && !hasAnyBookings && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No bookings recorded for this period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
