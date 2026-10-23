'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RevenueRangePicker } from '@/components/dashboard/revenue-range-picker'
import { RevenueSourceSelect } from '@/components/dashboard/revenue-source-select'
import type {
  RevenueSource,
  RevenueTrendMeta,
  RevenueTrendPoint,
} from '@/lib/dashboard/revenue-range'

interface RevenueChartProps {
  points: RevenueTrendPoint[]
  meta: RevenueTrendMeta
}

const BUCKET_NOUN: Record<string, string> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
}

/**
 * `all` stays wordless so the default subtitle reads exactly as it did before
 * the source selector existed. A narrowed view says so.
 */
const SOURCE_NOUN: Record<RevenueSource, string> = {
  all: '',
  customer: ' · customer',
  business: ' · business',
}

// Recharts measures its container, so it only renders in the browser. The
// placeholder holds the same 250px so the card does not jump on load.
const RevenueAreaChart = dynamic(
  () => import('@/components/dashboard/revenue-area-chart').then((m) => m.RevenueAreaChart),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse rounded-lg bg-muted/30" /> }
)

export function RevenueChart({ points, meta }: RevenueChartProps) {
  const { range } = meta
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const hasAnyRevenue = totalRevenue > 0

  return (
    <Card className="admin-card-hover">
      {/* Wraps rather than squeezes: two control groups plus the title exceed
          the card width, and compressing the title made the subtitle break
          mid-phrase. Below sm everything stacks, so the card still fits a
          phone viewport. */}
      <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 border-b border-border pb-3 sm:flex-row sm:flex-wrap">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          <CardDescription className="mt-0.5">
            {hasAnyRevenue ? (
              <span className="font-medium text-primary">{formatCurrency(totalRevenue)}</span>
            ) : (
              <span>No revenue</span>
            )}
            {/* "booked" is load-bearing: this chart buckets by when a booking
                was sold (created_at), while other panels on this dashboard
                show trip dates (pickup_datetime). */}
            <span className="ml-1.5 text-muted-foreground">
              {SOURCE_NOUN[meta.source]} · booked · {BUCKET_NOUN[range.bucket] ?? range.bucket}
            </span>
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <RevenueSourceSelect source={meta.source} />
          <RevenueRangePicker range={range} />
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <RevenueAreaChart points={points} />

        <ChartNotice meta={meta} hasAnyRevenue={hasAnyRevenue} />
      </CardContent>
    </Card>
  )
}

interface ChartNoticeProps {
  meta: RevenueTrendMeta
  hasAnyRevenue: boolean
}

/**
 * Distinguishes "nothing in this range" from "nothing recorded yet". An
 * all-zero chart otherwise reads as broken rather than simply empty.
 */
function ChartNotice({ meta, hasAnyRevenue }: ChartNoticeProps) {
  const notices: string[] = []

  if (meta.error) {
    return (
      <p className="mt-2 text-center text-xs text-destructive">
        Could not load revenue data. {meta.error}
      </p>
    )
  }

  if (!hasAnyRevenue) {
    notices.push(
      meta.hasAnyHistory
        ? 'No revenue recorded in this range. Try a wider range or a different period.'
        : 'No revenue recorded yet. The chart fills in once bookings are paid.'
    )
  }

  if (meta.truncated) {
    notices.push('Showing a partial result. This range exceeds the row limit.')
  }

  if (meta.range.bucketAdjusted) {
    notices.push(`Grouped by ${BUCKET_NOUN[meta.range.bucket]} to keep the range readable.`)
  }

  if (meta.includedPaymentStatuses.length > 1) {
    notices.push(`Dev mode: includes ${meta.includedPaymentStatuses.join(', ')} payments.`)
  }

  if (notices.length === 0) return null

  return (
    <div className="mt-2 space-y-1">
      {notices.map((notice) => (
        <p key={notice} className="text-center text-xs text-muted-foreground">
          {notice}
        </p>
      ))}
    </div>
  )
}
