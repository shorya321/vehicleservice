'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RevenueRangePicker } from '@/components/dashboard/revenue-range-picker'
import type { RevenueTrendMeta, RevenueTrendPoint } from '@/lib/dashboard/revenue-range'

interface RevenueChartProps {
  points: RevenueTrendPoint[]
  meta: RevenueTrendMeta
}

const BUCKET_NOUN: Record<string, string> = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
}

export function RevenueChart({ points, meta }: RevenueChartProps) {
  const { range } = meta
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 0)
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const hasAnyRevenue = totalRevenue > 0

  return (
    <Card className="admin-card-hover">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-border pb-3">
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
              · booked · {BUCKET_NOUN[range.bucket] ?? range.bucket}
            </span>
          </CardDescription>
        </div>
        <div className="shrink-0">
          <RevenueRangePicker range={range} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative h-[250px]">
          <div className="relative flex h-[200px] items-end justify-between gap-1">
            {points.map((point) => {
              const hasRevenue = point.revenue > 0
              // Scale from a 16px floor to 160px so small non-zero values stay
              // visible; empty buckets get a flat 8px stub. The 200px track
              // leaves ~40px of headroom so the hover tooltip stays inside the
              // chart instead of overlapping the header.
              const barHeight = hasRevenue && maxRevenue > 0
                ? 16 + (point.revenue / maxRevenue) * 144
                : 8

              return (
                <div
                  key={point.date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  <div
                    className={`
                      w-full
                      ${hasRevenue
                        ? 'bg-primary hover:bg-primary/80'
                        : 'bg-primary/30 hover:bg-primary/50'}
                      relative rounded-t transition-all duration-200
                    `}
                    style={{ height: `${barHeight}px`, minHeight: '4px' }}
                  >
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                      <div className="font-semibold">
                        {hasRevenue ? formatCurrency(point.revenue) : 'No revenue'}
                      </div>
                      <div className="text-xs opacity-75">{point.label}</div>
                    </div>
                  </div>

                  <div
                    className="mt-2 text-center text-xs text-muted-foreground"
                    style={{ fontSize: points.length > 24 ? '0.6rem' : undefined }}
                  >
                    {point.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
 * Distinguishes "nothing in this range" from "nothing recorded yet" — an
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
        : 'No revenue recorded yet. Bars will appear here once bookings are paid.'
    )
  }

  if (meta.truncated) {
    notices.push('Showing a partial result — this range exceeds the row limit.')
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
