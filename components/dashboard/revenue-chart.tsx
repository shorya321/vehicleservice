'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { getRevenueTrend, type PeriodType } from '@/app/admin/dashboard/actions'
import { Skeleton } from '@/components/ui/skeleton'

interface RevenueChartProps {
  initialData: Array<{
    date: string
    label: string
    revenue: number
  }>
}

export function RevenueChart({ initialData }: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('daily')
  const [revenueTrend, setRevenueTrend] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (period: PeriodType) => {
    if (period === selectedPeriod) return

    setSelectedPeriod(period)
    startTransition(async () => {
      const newData = await getRevenueTrend(period)
      setRevenueTrend(newData)
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

  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue))
  const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0)
  const hasAnyRevenue = totalRevenue > 0

  return (
    <Card className="admin-card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border">
        <div>
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          <CardDescription className="mt-0.5">
            {getDateRangeLabel()}
            {hasAnyRevenue && (
              <span className="ml-2 text-primary font-medium">
                (Total: {formatCurrency(totalRevenue)})
              </span>
            )}
          </CardDescription>
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
      <CardContent>
        {isPending ? (
          <SkeletonBars count={selectedPeriod === 'daily' ? 7 : selectedPeriod === 'weekly' ? 8 : 12} />
        ) : (
          <div className="h-[250px] relative">
            <div className="h-[200px] flex items-end justify-between gap-1 relative">
              {revenueTrend.map((item, index) => {
                // Calculate height with proper scaling
                const hasRevenue = item.revenue > 0
                let barHeight = 0

                if (hasRevenue && maxRevenue > 0) {
                  // Scale from 20px minimum to 180px maximum
                  barHeight = 20 + ((item.revenue / maxRevenue) * 160)
                } else if (!hasRevenue) {
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
                        ${hasRevenue
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
                        <div className="font-semibold">{item.revenue > 0 ? formatCurrency(item.revenue) : 'No revenue'}</div>
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

            {/* Show message if no revenue at all - moved outside the chart area */}
          </div>
        )}
        {!isPending && !hasAnyRevenue && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No revenue recorded for this period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SkeletonBars({ count }: { count: number }) {
  const [heights] = useState(() =>
    Array.from({ length: count }, () => Math.random() * 80 + 20)
  )
  return (
    <div className="h-[200px] flex items-end justify-between gap-1">
      {heights.slice(0, count).map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}