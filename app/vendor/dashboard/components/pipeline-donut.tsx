'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts'

// A type alias, not an interface: recharts' data prop needs an index-signature
// compatible shape, which only aliases satisfy implicitly.
export type DonutSegment = {
  key: string
  label: string
  value: number
  /** Hex colour. SVG presentation attributes don't resolve CSS variables. */
  color: string
}

interface PipelineDonutProps {
  segments: DonutSegment[]
  size: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload?: DonutSegment }>
}

function DonutTooltip({ active, payload }: TooltipProps) {
  const segment = payload?.[0]?.payload
  if (!active || !segment) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <span className="font-semibold">{segment.value}</span> {segment.label.toLowerCase()}
    </div>
  )
}

/** Ring only. The total in the centre and the legend are rendered by the server card. */
export function PipelineDonut({ segments, size }: PipelineDonutProps) {
  const filled = segments.filter((segment) => segment.value > 0)
  const thickness = Math.round(size * 0.1)
  const outerRadius = size / 2 - 2

  return (
    <PieChart width={size} height={size}>
      <Pie
        data={filled}
        dataKey="value"
        nameKey="label"
        cx="50%"
        cy="50%"
        innerRadius={outerRadius - thickness}
        outerRadius={outerRadius}
        startAngle={90}
        endAngle={-270}
        paddingAngle={filled.length > 1 ? 2 : 0}
        stroke="none"
        isAnimationActive={false}
      >
        {filled.map((segment) => (
          <Cell key={segment.key} fill={segment.color} />
        ))}
      </Pie>
      <Tooltip content={<DonutTooltip />} />
    </PieChart>
  )
}
