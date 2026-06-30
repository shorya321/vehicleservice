'use client'

import { motion } from 'motion/react'
import { Star } from 'lucide-react'
import { StarRating } from './star-rating'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ReviewStatsData {
  totalReviews: number
  averageRating: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface ReviewStatsProps {
  stats: ReviewStatsData
  layout?: 'horizontal' | 'vertical'
  className?: string
}

export function ReviewStats({ stats, layout = 'horizontal', className }: ReviewStatsProps) {
  const ratingLevels = [5, 4, 3, 2, 1] as const

  const getPercentage = (count: number) => {
    if (stats.totalReviews === 0) return 0
    return (count / stats.totalReviews) * 100
  }

  if (layout === 'vertical') {
    return (
      <Card
        className={cn(
          'p-6 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)]',
          className
        )}
      >
        <div className="space-y-6">
          {/* Average Rating */}
          <div className="text-center space-y-2">
            <div className="text-[clamp(2.5rem,5vw,3.5rem)] font-medium text-[var(--text-primary)] font-display">
              {stats.averageRating.toFixed(1)}
            </div>
            <StarRating rating={stats.averageRating} size="lg" className="justify-center" />
            <p className="text-[0.875rem] text-[var(--text-secondary)]">
              Based on {stats.totalReviews.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            {ratingLevels.map((level) => {
              const count = stats.distribution[level]
              const percentage = getPercentage(count)

              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-[0.875rem] text-[var(--text-secondary)]">{level}</span>
                    <Star className="w-3 h-3 text-[var(--gold)] fill-[var(--gold)]" />
                  </div>
                  <div className="flex-1 h-2 bg-[var(--graphite)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-[var(--gold)] to-[rgba(var(--gold-rgb),0.8)] rounded-full"
                    />
                  </div>
                  <span className="text-[0.875rem] text-[var(--text-secondary)] w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // Horizontal layout
  return (
    <Card
      className={cn(
        'p-6 bg-[rgba(var(--charcoal-rgb),0.5)] backdrop-blur-md border-[var(--graphite)]',
        className
      )}
    >
      <div className="flex items-center gap-8">
        {/* Average Rating - Left Side */}
        <div className="flex flex-col items-center space-y-2 min-w-[180px]">
          <div className="text-[clamp(3rem,6vw,4rem)] font-medium text-[var(--text-primary)] font-display">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={stats.averageRating} size="lg" />
          <p className="text-[0.875rem] text-[var(--text-secondary)] text-center">
            {stats.totalReviews.toLocaleString()} reviews
          </p>
        </div>

        {/* Rating Distribution - Right Side */}
        <div className="flex-1 space-y-3">
          {ratingLevels.map((level) => {
            const count = stats.distribution[level]
            const percentage = getPercentage(count)

            return (
              <div key={level} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-14">
                  <span className="text-[0.875rem] text-[var(--text-secondary)]">{level}</span>
                  <Star className="w-3 h-3 text-[var(--gold)] fill-[var(--gold)]" />
                </div>
                <div className="flex-1 h-2.5 bg-[var(--graphite)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: level * 0.1 }}
                    className="h-full bg-gradient-to-r from-[var(--gold)] to-[rgba(var(--gold-rgb),0.8)] rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[80px]">
                  <span className="text-[0.875rem] text-[var(--text-secondary)]">
                    {percentage.toFixed(0)}%
                  </span>
                  <span className="text-[0.75rem] text-[var(--text-muted)]">
                    ({count.toLocaleString()})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

// Compact version for inline display
export function ReviewStatsCompact({ stats }: { stats: ReviewStatsData }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-baseline gap-2">
        <span className="text-[clamp(1.5rem,3vw,2rem)] font-medium text-[var(--text-primary)] font-display">
          {stats.averageRating.toFixed(1)}
        </span>
        <Star className="w-5 h-5 text-[var(--gold)] fill-[var(--gold)] mb-1" />
      </div>
      <div className="h-8 w-px bg-[var(--graphite)]" />
      <p className="text-[0.875rem] text-[var(--text-secondary)]">
        {stats.totalReviews.toLocaleString()} reviews
      </p>
    </div>
  )
}
