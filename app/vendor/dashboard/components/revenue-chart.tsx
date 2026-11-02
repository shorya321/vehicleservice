'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { getVendorRevenueTrend, type PeriodType } from '../actions'
import { DollarSign } from 'lucide-react'
import { CustomRangeButton } from './custom-range-button'

interface RevenueChartProps {
  initialData: Array<{
    date: string
    label: string
    revenue: number
  }>
}

// Recharts measures its container, so it only renders in the browser. The
// placeholder holds the same 250px so the card does not jump on load.
const RevenueAreaChart = dynamic(
  () => import('@/components/dashboard/revenue-area-chart').then((m) => m.RevenueAreaChart),
  { ssr: false, loading: () => <ChartPlaceholder /> }
)

function ChartPlaceholder() {
  return <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted/30" />
}

const PERIODS: PeriodType[] = ['daily', 'weekly', 'monthly']
const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export function RevenueChart({ initialData }: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('daily')
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [customLabel, setCustomLabel] = useState('')
  const [revenueTrend, setRevenueTrend] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (period: PeriodType) => {
    if (mode === 'preset' && period === selectedPeriod) return

    setMode('preset')
    setSelectedPeriod(period)
    startTransition(async () => {
      const newData = await getVendorRevenueTrend(period)
      setRevenueTrend(newData)
    })
  }

  const handleCustomApply = (from: string, to: string) => {
    setMode('custom')
    setCustomLabel(`${from} - ${to}`)
    startTransition(async () => {
      const newData = await getVendorRevenueTrend({ from, to })
      setRevenueTrend(newData)
    })
  }

  const getDateRangeLabel = () => {
    if (mode === 'custom') return `${customLabel} performance`
    switch (selectedPeriod) {
      case 'daily':
        return 'Last 7 days performance'
      case 'weekly':
        return 'Last 8 weeks performance'
      case 'monthly':
        return 'Last 12 months performance'
    }
  }

  const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0)
  const hasAnyRevenue = totalRevenue > 0

  return (
    <Card className="admin-card-hover">
      {/* Stacks below sm and wraps above it: title plus four period buttons
          need ~465px on one row, which widened the whole chart grid on phones. */}
      <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 pb-3 border-b border-border sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Fulfilled Booking Value</CardTitle>
            <CardDescription className="mt-0.5">
              {getDateRangeLabel()}
              {hasAnyRevenue && (
                <span className="ml-2 text-primary font-medium">
                  (Total: {formatCurrency(totalRevenue)})
                </span>
              )}
            </CardDescription>
          </div>
        </div>
        <div className="admin-period-selector">
          {PERIODS.map((period) => (
            <button
              key={period}
              className={cn(
                "admin-period-btn",
                mode === 'preset' && selectedPeriod === period
                  ? "admin-period-btn-active"
                  : "admin-period-btn-inactive"
              )}
              onClick={() => handlePeriodChange(period)}
              disabled={isPending}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
          <CustomRangeButton
            active={mode === 'custom'}
            label={customLabel}
            onApply={handleCustomApply}
            disabled={isPending}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isPending ? <ChartPlaceholder /> : <RevenueAreaChart points={revenueTrend} />}
        {!isPending && !hasAnyRevenue && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No revenue recorded for this period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
