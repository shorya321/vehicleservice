'use client'

import dynamic from 'next/dynamic'
import type { DonutSegment } from './pipeline-donut'

// Recharts renders in the browser only. The placeholder ring keeps the same
// footprint, so the card does not shift when the chart loads.
const PipelineDonut = dynamic(
  () => import('./pipeline-donut').then((m) => m.PipelineDonut),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-full border-[17px] border-border" />,
  }
)

interface PipelineDonutLoaderProps {
  segments: DonutSegment[]
  size: number
}

export function PipelineDonutLoader({ segments, size }: PipelineDonutLoaderProps) {
  return <PipelineDonut segments={segments} size={size} />
}
