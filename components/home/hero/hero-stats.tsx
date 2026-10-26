import * as React from 'react'
import { MapPin, Star, Timer } from 'lucide-react'
import type { HeroContent } from '@/lib/cms/templates/home/schema'

type HeroStat = HeroContent['stats'][number]
type StatIconKind = 'pin' | 'clock' | 'star'

const ICONS: Record<StatIconKind, typeof MapPin> = { pin: MapPin, clock: Timer, star: Star }

/**
 * The CMS stat has no icon field, so the icon follows what the stat is: the
 * rating gets a star, anything about waiting or time a clock, the rest a pin.
 */
export function statIconKind(stat: HeroStat): StatIconKind {
  if (stat.is_rating) return 'star'
  if (/wait|time|min/i.test(stat.label)) return 'clock'
  return 'pin'
}

interface HeroStatsProps {
  stats: HeroStat[]
}

/**
 * The figures under the hero search bar, one glass chip each: icon, figure,
 * label. A <dl> keeps term before figure in the markup; CSS puts the figure
 * first on screen.
 */
export function HeroStats({ stats }: HeroStatsProps): React.JSX.Element | null {
  if (stats.length === 0) return null

  return (
    <dl className="hero-reveal hero-reveal--stats hero-stats mt-8">
      {stats.map((stat, index) => {
        const Icon = ICONS[statIconKind(stat)]
        return (
          <div key={index} className="hero-stats-chip">
            <dt className="hero-stats-label">{stat.label}</dt>
            <dd>
              <span className="hero-stats-icon" aria-hidden="true">
                <Icon strokeWidth={1.6} />
              </span>
              <span className="hero-stats-figure">{stat.value}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
