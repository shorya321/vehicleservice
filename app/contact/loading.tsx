function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function ContactLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      <div className="luxury-container py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-9 w-48 mx-auto bg-luxury-gold/10" />
          <Skeleton className="h-4 w-72 mx-auto bg-luxury-gold/10" />
        </div>

        <div className="max-w-xl mx-auto">
          <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
              <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
              <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
              <Skeleton className="h-28 w-full rounded-md bg-luxury-gold/10" />
            </div>
            <Skeleton className="h-12 w-full rounded-md bg-luxury-gold/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
