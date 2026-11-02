import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ListChecks, ArrowRight, ChevronRight } from 'lucide-react'
import type { BookingPipeline } from '../actions'
import { PipelineDonutLoader } from './pipeline-donut-loader'

interface BookingPipelineChartProps {
  data: BookingPipeline
}

interface Segment {
  key: keyof BookingPipeline
  label: string
  value: number
  /** Hex for the recharts ring (Tailwind 500 shade, same as the old bars). */
  color: string
  /** Tailwind bg for the legend dot. */
  dot: string
  /** Tailwind text for the count. */
  text: string
  /**
   * `booking_assignments.status` the bookings list filters by. Cancelled has
   * none: it also counts `rejected`, which that filter cannot show, so a link
   * would open a list that disagrees with the number beside it.
   */
  status?: string
}

const DONUT_SIZE = 168

function percent(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : '0%'
}

export function BookingPipelineChart({ data }: BookingPipelineChartProps) {
  const segments: Segment[] = [
    { key: 'pending', label: 'Pending', value: data.pending, color: '#f59e0b', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', status: 'pending' },
    { key: 'upcoming', label: 'Upcoming', value: data.upcoming, color: '#0ea5e9', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', status: 'accepted' },
    { key: 'completed', label: 'Completed', value: data.completed, color: '#10b981', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', status: 'completed' },
    { key: 'cancelled', label: 'Cancelled', value: data.cancelled, color: '#f43f5e', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  ]

  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const hasAny = total > 0

  return (
    <Card className="admin-card-hover">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
            <ListChecks className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Booking Pipeline</CardTitle>
            <CardDescription className="mt-0.5">Current status of your jobs</CardDescription>
          </div>
        </div>
        {/* Pending is the actionable queue. Surface it as a link to the jobs page. */}
        <Link
          href="/vendor/bookings"
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            data.pending > 0
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {data.pending > 0 ? `${data.pending} need action` : 'View jobs'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex min-h-[226px] flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
            {hasAny ? (
              <PipelineDonutLoader segments={segments.map(({ key, label, value, color }) => ({ key, label, value, color }))} size={DONUT_SIZE} />
            ) : (
              <div className="h-full w-full rounded-full border-[17px] border-border" />
            )}
            {/* pointer-events-none keeps the ring's hover tooltip reachable underneath. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">total jobs</span>
            </div>
          </div>

          <ul className="w-full min-w-0 space-y-1">
            {segments.map((segment) => (
              <li key={segment.key}>
                <LegendRow segment={segment} total={total} />
              </li>
            ))}
          </ul>
        </div>
        {!hasAny && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No bookings assigned yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function LegendRow({ segment, total }: { segment: Segment; total: number }) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', segment.dot)} />
        <span className="truncate">{segment.label}</span>
      </span>
      <span className={cn('text-sm font-semibold tabular-nums', segment.value > 0 ? segment.text : 'text-muted-foreground')}>
        {segment.value}
      </span>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{percent(segment.value, total)}</span>
      {segment.status ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      ) : (
        <span className="w-4" aria-hidden="true" />
      )}
    </>
  )
  const rowClass = 'grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-lg px-2.5 py-2'

  if (!segment.status) {
    return <div className={rowClass}>{body}</div>
  }
  return (
    <Link
      href={`/vendor/bookings?status=${segment.status}`}
      className={cn(rowClass, 'group transition-colors hover:bg-primary/5')}
      aria-label={`${segment.label}: ${segment.value} jobs. View in bookings`}
    >
      {body}
    </Link>
  )
}
