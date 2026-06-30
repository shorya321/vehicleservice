function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function PaymentLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      <div className="luxury-container py-12 md:py-16 lg:py-20">
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-9 w-64 mx-auto bg-luxury-gold/10" />
          <Skeleton className="h-4 w-80 mx-auto bg-luxury-gold/10" />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5">
              <Skeleton className="h-6 w-40 bg-luxury-gold/10" />
              <Skeleton className="h-[300px] w-full rounded-md bg-luxury-gold/10" />
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5 lg:sticky lg:top-24">
              <Skeleton className="h-6 w-32 bg-luxury-gold/10" />
              <div className="flex items-center gap-3 pb-4 border-b border-luxury-gold/10">
                <Skeleton className="h-16 w-24 rounded-md bg-luxury-gold/10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32 bg-luxury-gold/10" />
                  <Skeleton className="h-3 w-20 bg-luxury-gold/10" />
                </div>
              </div>
              <div className="space-y-3 pb-4 border-b border-luxury-gold/10">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16 bg-luxury-gold/10" />
                <Skeleton className="h-7 w-24 bg-luxury-gold/10" />
              </div>
              <Skeleton className="h-12 w-full rounded-md bg-luxury-gold/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
