'use client';

/**
 * Business Portal Luxury Skeleton Component
 * Premium styled loading skeleton with shimmer animation
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LuxurySkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show the shimmer animation */
  animate?: boolean;
}

function LuxurySkeleton({
  className,
  animate = true,
  ...props
}: LuxurySkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--business-radius-md)]',
        'bg-[var(--business-surface-3)]',
        animate && 'business-shimmer',
        className
      )}
      {...props}
    />
  );
}

// Preset skeleton components for common patterns
function LuxurySkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <LuxurySkeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

function LuxurySkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--business-radius-xl)] p-6',
        'bg-[var(--business-surface-1)]',
        'border border-[var(--business-border-subtle)]',
        'space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <LuxurySkeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <LuxurySkeleton className="h-4 w-1/3" />
          <LuxurySkeleton className="h-3 w-1/4" />
        </div>
      </div>
      <LuxurySkeletonText lines={2} />
    </div>
  );
}

function LuxurySkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--business-radius-xl)]',
        'border border-[var(--business-border-default)]',
        'overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-4 p-4 bg-[var(--business-surface-1)] border-b border-[var(--business-border-subtle)]">
        {Array.from({ length: columns }).map((_, i) => (
          <LuxurySkeleton key={i} className="h-3 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            'flex gap-4 p-4',
            rowIndex !== rows - 1 && 'border-b border-[var(--business-border-subtle)]'
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LuxurySkeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function LuxurySkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--business-radius-xl)] p-6',
        'bg-[var(--business-surface-1)]',
        'border border-[var(--business-border-subtle)]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <LuxurySkeleton className="h-3 w-20" />
          <LuxurySkeleton className="h-8 w-24" />
          <LuxurySkeleton className="h-3 w-16" />
        </div>
        <LuxurySkeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export {
  LuxurySkeleton,
  LuxurySkeletonText,
  LuxurySkeletonCard,
  LuxurySkeletonTable,
  LuxurySkeletonStatCard,
};
