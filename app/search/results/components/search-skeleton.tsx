'use client'

export function SearchSummarySkeleton() {
  return (
    <div className="bg-[var(--charcoal)] border-b border-[rgba(var(--gold-rgb),0.15)]">
      <div className="luxury-container py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-32 bg-[rgba(var(--gold-rgb),0.1)] rounded animate-pulse" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-[rgba(var(--gold-rgb),0.15)] rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-16 bg-[rgba(var(--gold-rgb),0.1)] rounded animate-pulse" />
                <div className="h-5 w-32 bg-[rgba(var(--gold-rgb),0.15)] rounded animate-pulse" />
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
    <div className="vehicle-card-surface overflow-hidden h-full flex flex-col rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--charcoal)]">
      <div className="relative aspect-[4/3] w-full bg-[rgba(var(--gold-rgb),0.05)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-lg bg-[rgba(var(--gold-rgb),0.1)] animate-pulse" />
        </div>
      </div>

      <div className="px-6 pb-6 pt-5 flex-1 flex flex-col">
        <div className="h-6 w-3/4 bg-[rgba(var(--gold-rgb),0.15)] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[rgba(var(--gold-rgb),0.1)] rounded mt-2 animate-pulse" />

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[var(--graphite)]">
          <div className="h-4 w-16 bg-[rgba(var(--gold-rgb),0.1)] rounded animate-pulse" />
          <div className="h-4 w-16 bg-[rgba(var(--gold-rgb),0.1)] rounded animate-pulse" />
        </div>

        <div className="mt-auto pt-6 flex items-end justify-between">
          <div>
            <div className="h-3 w-10 bg-[rgba(var(--gold-rgb),0.1)] rounded animate-pulse" />
            <div className="h-8 w-24 bg-[rgba(var(--gold-rgb),0.15)] rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-[rgba(var(--gold-rgb),0.15)] rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function VehicleTypeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="luxury-container py-12 lg:py-16 space-y-10">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[var(--graphite)] pb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 rounded animate-pulse bg-[rgba(var(--gold-rgb),0.1)]" style={{ width: `${50 + i * 16}px` }} />
          ))}
        </div>

        <VehicleTypeGridSkeleton />
      </div>
    </div>
  )
}
