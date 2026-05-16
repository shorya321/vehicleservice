'use client'

import { motion } from 'motion/react'

export function SearchSummarySkeleton() {
  return (
    <div className="backdrop-blur-lg bg-[var(--charcoal)]/80 border-b border-[var(--gold)]/20">
      <div className="luxury-container py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-32 bg-[var(--gold)]/10 rounded animate-pulse" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-[var(--gold)]/20 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-16 bg-[var(--gold)]/10 rounded animate-pulse" />
                <div className="h-5 w-32 bg-[var(--gold)]/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function VehicleTypeSkeleton() {
  return (
    <motion.div
      className="luxury-card overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Image Skeleton */}
      <div className="relative h-48 w-full bg-gradient-to-br from-[var(--gold)]/5 to-[var(--charcoal)]/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-lg bg-[var(--gold)]/10 animate-pulse" />
        </div>
      </div>

      {/* Details Skeleton */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <div className="h-6 w-3/4 bg-[var(--gold)]/20 rounded mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-[var(--gold)]/10 rounded mb-4 animate-pulse" />

        {/* Capacity */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-4 w-16 bg-[var(--gold)]/10 rounded animate-pulse" />
          <div className="h-4 w-16 bg-[var(--gold)]/10 rounded animate-pulse" />
        </div>

        {/* Features */}
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-20 bg-[var(--gold)]/10 rounded animate-pulse" />
          <div className="h-5 w-24 bg-[var(--gold)]/10 rounded animate-pulse" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="h-8 w-24 bg-[var(--gold)]/20 rounded mb-4 animate-pulse" />

        {/* Button */}
        <div className="h-14 w-full bg-[var(--gold)]/20 rounded animate-pulse" />
      </div>
    </motion.div>
  )
}

export function VehicleTypeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleTypeSkeleton key={i} />
      ))}
    </div>
  )
}

export function SearchPageSkeleton() {
  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      <SearchSummarySkeleton />

      <div className="luxury-container py-12 lg:py-16 space-y-8">
        <div className="rounded-[8px] border border-[var(--graphite)] bg-[var(--black-warm)] p-6">
          <div className="h-10 w-2/3 bg-[var(--gold)]/20 rounded mb-4 animate-pulse" />
          <div className="flex gap-6">
            <div className="h-5 w-32 bg-[var(--gold)]/10 rounded animate-pulse" />
            <div className="h-5 w-32 bg-[var(--gold)]/10 rounded animate-pulse" />
          </div>
        </div>

        <VehicleTypeGridSkeleton />
      </div>
    </div>
  )
}
