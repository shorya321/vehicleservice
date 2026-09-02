interface StatItem {
  label: string
  value: number
  /**
   * Reserved for a figure that genuinely needs attention. A zero never gets one:
   * "0 cancelled" is good news, and painting it in the alarm colour said the
   * opposite. Colour only lands when the value is non zero.
   */
  color?: string
}

interface InlineStatsProps {
  stats: StatItem[]
}

export function InlineStats({ stats }: InlineStatsProps) {
  return (
    <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap" role="group" aria-label="Statistics">
      {stats.map((stat) => {
        const emphasise = Boolean(stat.color) && stat.value > 0
        return (
          <span key={stat.label} className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-semibold tabular-nums lining-nums ${emphasise ? "" : "text-[var(--text-primary)]"}`}
              style={emphasise ? { color: stat.color } : undefined}
            >
              {stat.value}
            </span>
            <span className="account-label">{stat.label}</span>
          </span>
        )
      })}
    </div>
  )
}
