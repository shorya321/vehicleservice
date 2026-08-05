import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ListChecks, ArrowRight } from 'lucide-react'
import type { BookingPipeline } from '../actions'

interface BookingPipelineChartProps {
  data: BookingPipeline
}

interface Segment {
  key: keyof BookingPipeline
  label: string
  value: number
  /** Tailwind bg for the bar. */
  bar: string
  /** Tailwind text for the value label. */
  text: string
}

export function BookingPipelineChart({ data }: BookingPipelineChartProps) {
  const segments: Segment[] = [
    { key: 'pending', label: 'Pending', value: data.pending, bar: 'bg-amber-500', text: 'text-amber-500' },
    { key: 'upcoming', label: 'Upcoming', value: data.upcoming, bar: 'bg-sky-500', text: 'text-sky-500' },
    { key: 'completed', label: 'Completed', value: data.completed, bar: 'bg-emerald-500', text: 'text-emerald-500' },
    { key: 'cancelled', label: 'Cancelled', value: data.cancelled, bar: 'bg-rose-500', text: 'text-rose-500' },
  ]

  const maxValue = Math.max(...segments.map((s) => s.value))
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const hasAny = total > 0

  return (
    <Card className="admin-card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border">
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
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
            data.pending > 0
              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {data.pending > 0 ? `${data.pending} need action` : 'View jobs'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[250px] relative">
          <div className="h-[200px] flex items-end justify-between gap-3 relative">
            {segments.map((segment) => {
              let barHeight = 8 // minimal height for empty segments
              if (segment.value > 0 && maxValue > 0) {
                barHeight = 20 + (segment.value / maxValue) * 160
              }

              return (
                <div
                  key={segment.key}
                  className="flex-1 flex flex-col justify-end items-center group relative"
                >
                  <span className={cn('mb-1 text-sm font-semibold', segment.value > 0 ? segment.text : 'text-muted-foreground')}>
                    {segment.value}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-200',
                      segment.value > 0 ? segment.bar : 'bg-muted'
                    )}
                    style={{ height: `${barHeight}px`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground border px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-md pointer-events-none">
                      <span className="font-semibold">{segment.value}</span> {segment.label.toLowerCase()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-2">{segment.label}</div>
                </div>
              )
            })}
          </div>
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
