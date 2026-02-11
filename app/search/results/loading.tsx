function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function SearchResultsLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      {/* Search Summary Bar */}
      <div className="border-b border-luxury-gold/10 bg-luxury-darkGray/50 backdrop-blur-md">
        <div className="luxury-container py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64 bg-luxury-gold/10" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
                <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-24 rounded-md bg-luxury-gold/10" />
              <Skeleton className="h-9 w-24 rounded-md bg-luxury-gold/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="luxury-container py-8">
        {/* Filter Tabs / Category Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <Skeleton className="h-9 w-20 rounded-full bg-luxury-gold/10 flex-shrink-0" />
          <Skeleton className="h-9 w-24 rounded-full bg-luxury-gold/10 flex-shrink-0" />
          <Skeleton className="h-9 w-28 rounded-full bg-luxury-gold/10 flex-shrink-0" />
          <Skeleton className="h-9 w-22 rounded-full bg-luxury-gold/10 flex-shrink-0" />
          <Skeleton className="h-9 w-26 rounded-full bg-luxury-gold/10 flex-shrink-0" />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40 bg-luxury-gold/10" />
          <Skeleton className="h-9 w-32 rounded-md bg-luxury-gold/10" />
        </div>

        {/* Vehicle Cards Grid - 6 cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md overflow-hidden"
            >
              {/* Vehicle Image Placeholder */}
              <Skeleton className="h-48 w-full rounded-none bg-luxury-gold/10" />

              <div className="p-5 space-y-4">
                {/* Vehicle Name & Category */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
                </div>

                {/* Vehicle Features Row */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-luxury-gold/10">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16 bg-luxury-gold/10" />
                    <Skeleton className="h-7 w-24 bg-luxury-gold/10" />
                  </div>
                  <Skeleton className="h-10 w-28 rounded-md bg-luxury-gold/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
