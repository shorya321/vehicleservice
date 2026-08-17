'use client'

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

/**
 * How many buckets fit before x-axis labels collide. Past this, only every
 * n-th label is drawn; every bar keeps its hover tooltip, so no value is lost.
 */
const MAX_READABLE_LABELS = 12

function labelStride(bucketCount: number): number {
  return Math.max(1, Math.ceil(bucketCount / MAX_READABLE_LABELS))
}

/**
 * The last bucket always gets a label, since it is the one an admin reads
 * first. A strided label too close to it is dropped so the two don't collide.
 */
function showsLabel(index: number, lastIndex: number, stride: number): boolean {
  if (index === lastIndex) return true
  return index % stride === 0 && lastIndex - index >= stride
}

/**
 * Labels and tooltips are centred on their bar, so ones near an end hang
 * outside the chart and get clipped. Anchoring to the column's own edge instead
 * makes them open inward.
 *
 * `band` is how many columns in from each end need that treatment. A label is
 * about as wide as its bar, so it only ever needs the outermost column. A
 * tooltip is far wider than a bar once the range is dense, so it needs several.
 */
function edgeAnchor(index: number, lastIndex: number, band: number): string {
  if (index <= band) return 'left-0'
  if (index >= lastIndex - band) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

/**
 * A tooltip runs roughly 90px wide. At 60 buckets in a ~580px track a column is
 * under 6px, so its centred tooltip overhangs about eight columns either side.
 * An eighth of the range covers that at every bucket count the chart allows,
 * and at both desktop and phone widths.
 */
function tooltipBand(bucketCount: number): number {
  return Math.ceil(bucketCount / 8)
}

export function RevenueChart({ points, meta }: RevenueChartProps) {
  const { range } = meta
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 0)
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const hasAnyRevenue = totalRevenue > 0
  const stride = labelStride(points.length)
  const lastIndex = points.length - 1
  const tipBand = tooltipBand(points.length)

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

      <CardContent>
        {/* pt-10 puts the box's spare 50px above the bar row rather than below
            it, where nothing used it. The tooltip opens upward off the tallest
            bar, so without that headroom overflow-hidden cuts it off.
            overflow-hidden itself is a backstop: without it a wide range paints
            its bars straight over the panel sitting beside this card. */}
        <div className="relative h-[250px] overflow-hidden pt-10">
          <div className="relative flex h-[200px] items-end justify-between gap-1">
            {points.map((point, index) => {
              const hasRevenue = point.revenue > 0
              // Scale from a 16px floor to 160px so small non-zero values stay
              // visible; empty buckets get a flat 8px stub. A full-height bar
              // leaves 16px above it inside the 200px track, and the wrapper's
              // pt-10 supplies the rest of the room the tooltip needs.
              const barHeight = hasRevenue && maxRevenue > 0
                ? 16 + (point.revenue / maxRevenue) * 144
                : 8

              return (
                // min-w-0 is load-bearing: a flex item defaults to
                // min-width:auto, so without it a column can never shrink below
                // its own x-axis label and the whole row grows past the card.
                <div
                  key={point.date}
                  className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
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
                    <div
                      className={`pointer-events-none absolute bottom-full z-10 mb-1 ${edgeAnchor(index, lastIndex, tipBand)} whitespace-nowrap rounded border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100`}
                    >
                      <div className="font-semibold">
                        {hasRevenue ? formatCurrency(point.revenue) : 'No revenue'}
                      </div>
                      <div className="text-xs opacity-75">{point.label}</div>
                    </div>
                  </div>

                  <div className="relative mt-2 h-4 w-full">
                    {/* Absolutely positioned so the label adds no min-content
                        width of its own; the column is then free to shrink and
                        the text stays centred and unclipped. */}
                    {showsLabel(index, lastIndex, stride) && (
                      <span
                        className={`absolute ${edgeAnchor(index, lastIndex, 0)} whitespace-nowrap text-xs text-muted-foreground`}
                        style={{ fontSize: points.length > 24 ? '0.6rem' : undefined }}
                      >
                        {point.label}
                      </span>
                    )}
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
        : 'No revenue recorded yet. Bars will appear here once bookings are paid.'
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
