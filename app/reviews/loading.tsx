function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function ReviewsLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      <div className="luxury-container py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-12 w-64 mx-auto bg-luxury-gold/10" />
          <Skeleton className="h-4 w-80 mx-auto bg-luxury-gold/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 p-6 text-center space-y-2">
              <Skeleton className="h-10 w-16 mx-auto bg-luxury-gold/10" />
              <Skeleton className="h-3 w-24 mx-auto bg-luxury-gold/10" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-luxury-gold/10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 bg-luxury-gold/10" />
                  <Skeleton className="h-3 w-20 bg-luxury-gold/10" />
                </div>
              </div>
              <Skeleton className="h-3 w-24 bg-luxury-gold/10" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-luxury-gold/10" />
                <Skeleton className="h-3 w-3/4 bg-luxury-gold/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
