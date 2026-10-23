'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { compactAmount, labelStride, showsLabel } from '@/lib/dashboard/chart-format'
import type { RevenueTrendPoint } from '@/lib/dashboard/revenue-range'

interface RevenueAreaChartProps {
  points: RevenueTrendPoint[]
}

interface TooltipPayload {
  payload?: RevenueTrendPoint
}

interface RevenueTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function RevenueTooltip({ active, payload }: RevenueTooltipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <div className="text-muted-foreground">{point.label}</div>
      <div className="mt-0.5 font-semibold">
        {point.revenue > 0 ? formatCurrency(point.revenue) : 'No revenue'}
      </div>
    </div>
  )
}

/**
 * Colours come from the wrapper's `text-primary` through `currentColor`:
 * SVG presentation attributes don't resolve `var()`, so the theme token can't
 * be handed to recharts directly. Grid and tick colours are set in
 * `.admin-revenue-chart` rules in app/admin/globals.css for the same reason.
 */
export function RevenueAreaChart({ points }: RevenueAreaChartProps) {
  const gradientId = `revenue-fill-${useId().replace(/:/g, '')}`
  const lastIndex = points.length - 1
  const stride = labelStride(points.length)
  const ticks = points
    .filter((_, index) => showsLabel(index, lastIndex, stride))
    .map((point) => point.date)
  const labelByDate = new Map(points.map((point) => [point.date, point.label]))

  return (
    <div className="admin-revenue-chart h-[250px] w-full text-primary">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 250 }}>
        <AreaChart data={points} margin={{ top: 16, right: 28, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.4} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            // Thins further on narrow screens, where even the strided labels
            // collide; the last label is always kept.
            interval="preserveEnd"
            minTickGap={12}
            tickFormatter={(date: string) => labelByDate.get(date) ?? date}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
          />
          <YAxis
            tickFormatter={compactAmount}
            tickLine={false}
            axisLine={false}
            width={44}
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip
            content={<RevenueTooltip />}
            cursor={{ stroke: 'currentColor', strokeOpacity: 0.4, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="currentColor"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: 'currentColor', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
