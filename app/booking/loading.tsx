function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function BookingLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      <div className="luxury-container py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-9 w-72 mx-auto bg-luxury-gold/10" />
          <Skeleton className="h-4 w-96 mx-auto bg-luxury-gold/10" />
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-4">
            <Skeleton className="h-6 w-36 bg-luxury-gold/10" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                <Skeleton className="h-4 w-48 bg-luxury-gold/10" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                <Skeleton className="h-4 w-52 bg-luxury-gold/10" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                <Skeleton className="h-4 w-36 bg-luxury-gold/10" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-4">
            <Skeleton className="h-6 w-40 bg-luxury-gold/10" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-24 rounded-md bg-luxury-gold/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32 bg-luxury-gold/10" />
                <Skeleton className="h-3 w-20 bg-luxury-gold/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
