'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            {getDateRangeLabel()}
            {hasAnyRevenue && (
              <span className="ml-2 text-primary font-medium">
                (Total: {formatCurrency(totalRevenue)})
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={selectedPeriod === 'daily' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('daily')}
            disabled={isPending}
            className="h-8"
          >
            Daily
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('weekly')}
            disabled={isPending}
            className="h-8"
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('monthly')}
            disabled={isPending}
            className="h-8"
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
            {/* Grid lines for better visibility */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-muted-foreground/10" />
              <div className="border-t border-muted-foreground/10" />
              <div className="border-t border-muted-foreground/10" />
              <div className="border-t border-muted-foreground/10" />
              <div className="border-t border-muted-foreground/20" />
            </div>

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
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-200 hover:bg-gray-300'}
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