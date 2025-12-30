'use client';

/**
 * Dashboard Skeleton Components
 * Loading states for all dashboard sections
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/business/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton base with shimmer animation
 */
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        'bg-muted/50 animate-pulse',
        className
      )}
    />
  );
}

/**
 * Wallet Hero Card Skeleton
 * Large hero card with sparkline placeholder
 */
export function WalletHeroSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-2xl bg-card border border-border">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-5">
            {/* Icon placeholder */}
            <SkeletonPulse className="h-14 w-14 rounded-xl" />

            {/* Large value placeholder */}
            <div className="space-y-3">
              <SkeletonPulse className="h-14 w-48 rounded-lg" />
              <SkeletonPulse className="h-4 w-32 rounded" />
              <SkeletonPulse className="h-4 w-40 rounded" />
            </div>
          </div>

          {/* Sparkline placeholder - hidden on mobile */}
          <div className="hidden sm:block">
            <SkeletonPulse className="h-[70px] w-[160px] rounded-lg" />
          </div>
        </div>

        {/* Separator */}
        <div className="my-5 h-px bg-border" />

        {/* Button placeholder */}
        <SkeletonPulse className="h-9 w-32 rounded-lg" />
      </CardContent>
    </Card>
  );
}

/**
 * Single Stat Card Skeleton
 */
export function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-xl bg-card border border-border">
      <CardContent className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <SkeletonPulse className="h-4 w-24 rounded" />
          <SkeletonPulse className="h-9 w-9 rounded-full" />
        </div>

        {/* Value and trend */}
        <div className="flex items-baseline gap-2 mb-1">
          <SkeletonPulse className="h-8 w-16 rounded-lg" />
          <SkeletonPulse className="h-5 w-12 rounded-full" />
        </div>

        {/* Subtitle */}
        <SkeletonPulse className="h-4 w-28 rounded mt-2" />
      </CardContent>
    </Card>
  );
}

/**
 * Stats Grid Skeleton
 * 4 stat cards in a responsive grid
 */
export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Activity Item Skeleton
 */
function ActivityItemSkeleton({ isLast = false }: { isLast?: boolean }) {
  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-[18px] top-[44px] bottom-0 w-0.5 bg-border" />
      )}

      <div className="flex items-start gap-4 p-4 pr-5">
        {/* Timeline dot */}
        <SkeletonPulse className="h-3 w-3 rounded-full mt-1.5 shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-5 w-32 rounded" />
            <SkeletonPulse className="h-5 w-20 rounded-full" />
          </div>
          <SkeletonPulse className="h-4 w-48 rounded" />
        </div>

        {/* Price */}
        <SkeletonPulse className="h-5 w-16 rounded" />
      </div>
    </div>
  );
}

/**
 * Recent Activity Skeleton
 * Timeline with 5 item placeholders
 */
export function RecentActivitySkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-xl bg-card border border-border">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border">
        <div className="space-y-2">
          <SkeletonPulse className="h-4 w-28 rounded" />
          <SkeletonPulse className="h-4 w-40 rounded" />
        </div>
        <SkeletonPulse className="h-8 w-20 rounded-lg" />
      </CardHeader>

      {/* Activity list */}
      <CardContent className="p-0">
        <div className="relative pl-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivityItemSkeleton key={i} isLast={i === 4} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Location Item Skeleton
 */
function LocationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      {/* Icon */}
      <SkeletonPulse className="h-9 w-9 rounded-lg shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <SkeletonPulse className="h-4 w-28 rounded" />
          <SkeletonPulse className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonPulse className="h-3 w-24 rounded" />
        <SkeletonPulse className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

/**
 * Locations Card Skeleton
 * 6 location items
 */
export function LocationsCardSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-xl bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-4 w-4 rounded" />
          <SkeletonPulse className="h-4 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LocationItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Quick Action Item Skeleton
 */
function QuickActionItemSkeleton() {
  return (
    <div className="flex flex-col p-3 rounded-xl border border-border bg-card space-y-2">
      <SkeletonPulse className="h-10 w-10 rounded-lg" />
      <SkeletonPulse className="h-4 w-24 rounded" />
      <SkeletonPulse className="h-3 w-28 rounded" />
    </div>
  );
}

/**
 * Quick Actions Card Skeleton
 * 2x2 grid
 */
export function QuickActionsCardSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-xl bg-card border border-border">
      <CardHeader className="pb-3">
        <SkeletonPulse className="h-4 w-24 rounded" />
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <QuickActionItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Premium Features Card Skeleton
 */
export function PremiumFeaturesCardSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-2xl bg-card border border-border">
      <CardContent className="p-5 space-y-4">
        <SkeletonPulse className="h-12 w-12 rounded-xl" />
        <SkeletonPulse className="h-5 w-36 rounded" />
        <SkeletonPulse className="h-4 w-full rounded" />
        <SkeletonPulse className="h-4 w-3/4 rounded" />
        <SkeletonPulse className="h-9 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Header Skeleton
 */
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-64 rounded-lg" />
        <SkeletonPulse className="h-5 w-80 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-10 w-24 rounded-lg hidden sm:block" />
        <SkeletonPulse className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Full Dashboard Skeleton
 * Composite skeleton for initial page load
 */
export function DashboardFullSkeleton() {
  return (
    <div className="pb-12 space-y-6">
      {/* Header */}
      <DashboardHeaderSkeleton />

      {/* Main Grid */}
      <div className="grid gap-5 lg:gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Wallet Hero */}
          <WalletHeroSkeleton />

          {/* Stats Grid */}
          <StatsGridSkeleton />

          {/* Recent Activity */}
          <RecentActivitySkeleton />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-5">
          {/* Locations */}
          <LocationsCardSkeleton />

          {/* Quick Actions */}
          <QuickActionsCardSkeleton />

          {/* Premium Features */}
          <PremiumFeaturesCardSkeleton />
        </div>
      </div>
    </div>
  );
}
