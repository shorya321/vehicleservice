function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function AccountLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      <div className="luxury-container py-12 md:py-16 lg:py-20">
        <div className="mb-10 space-y-3">
          <Skeleton className="h-9 w-48 bg-luxury-gold/10" />
          <Skeleton className="h-4 w-64 bg-luxury-gold/10" />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full bg-luxury-gold/10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32 bg-luxury-gold/10" />
                  <Skeleton className="h-3 w-40 bg-luxury-gold/10" />
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-luxury-gold/10">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md bg-luxury-gold/10" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 p-6 space-y-5">
              <Skeleton className="h-6 w-40 bg-luxury-gold/10" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                    <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
