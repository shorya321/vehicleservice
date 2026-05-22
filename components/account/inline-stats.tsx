interface StatItem {
  label: string
  value: number
  color?: string
}

interface InlineStatsProps {
  stats: StatItem[]
}

export function InlineStats({ stats }: InlineStatsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Statistics">
      {stats.map((stat, i) => (
        <span key={stat.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-[var(--text-muted)] mx-1" aria-hidden="true">&middot;</span>}
          <span
            className={`text-base font-semibold tabular-nums lining-nums ${stat.color ? '' : 'text-[var(--text-primary)]'}`}
            style={stat.color ? { color: stat.color } : undefined}
          >
            {stat.value}
          </span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-[0.12em]">{stat.label}</span>
        </span>
      ))}
    </div>
  )
}
