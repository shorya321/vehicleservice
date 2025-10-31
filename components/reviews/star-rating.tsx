'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  showCount?: boolean
  count?: number
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showCount = false,
  count,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const displayRating = hoverRating !== null ? hoverRating : rating
  const isHalfStar = (index: number) => {
    const value = displayRating - index
    return value > 0 && value < 1
  }

  const isFilled = (index: number) => {
    return displayRating >= index + 1
  }

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      const newRating = index + 1
      onChange(newRating === rating ? 0 : newRating)
    }
  }

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!interactive) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(index)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const newRating = Math.min(index + 2, maxRating)
      onChange?.(newRating)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const newRating = Math.max(index, 0)
      onChange?.(newRating)
    }
  }

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={
        interactive
          ? `Rate out of ${maxRating} stars`
          : `Rating: ${rating.toFixed(1)} out of ${maxRating} stars`
      }
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const filled = isFilled(index)
        const halfStar = isHalfStar(index)

        return (
          <div
            key={index}
            className="relative"
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? filled : undefined}
            aria-label={interactive ? `${index + 1} star${index + 1 > 1 ? 's' : ''}` : undefined}
            tabIndex={interactive ? 0 : undefined}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-all duration-200',
                interactive && 'cursor-pointer',
                filled || halfStar
                  ? 'text-luxury-gold fill-luxury-gold'
                  : 'text-luxury-lightGray/30',
                interactive && 'hover:scale-110'
              )}
              strokeWidth={1.5}
            />
            {/* Half star overlay */}
            {halfStar && !interactive && (
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${(displayRating - index) * 100}%` }}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    'text-luxury-gold fill-luxury-gold'
                  )}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        )
      })}

      {showCount && count !== undefined && (
        <span className="ml-2 text-sm text-luxury-lightGray">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  )
}

// Compact version for inline display
export function StarRatingCompact({
  rating,
  count,
  className,
}: {
  rating: number
  count?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Star className="w-4 h-4 text-luxury-gold fill-luxury-gold" strokeWidth={1.5} />
      <span className="text-sm font-medium text-luxury-lightGray">
        {rating.toFixed(1)}
        {count !== undefined && (
          <span className="text-luxury-lightGray/60 ml-1">
            ({count.toLocaleString()})
          </span>
        )}
      </span>
    </div>
  )
}
