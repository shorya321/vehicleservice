function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ''}`} />
}

export default function CheckoutLoading() {
  return (
    <div className="bg-luxury-black min-h-screen">
      {/* Progress Bar */}
      <div className="border-b border-luxury-gold/10 bg-luxury-darkGray/50 backdrop-blur-md">
        <div className="luxury-container py-3">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full bg-luxury-gold/10" />
                <Skeleton className="h-3 w-16 bg-luxury-gold/10" />
                {i < 2 && <Skeleton className="h-0.5 w-12 bg-luxury-gold/10" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="luxury-container py-12 md:py-16 lg:py-20">
        {/* Checkout Heading */}
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-9 w-72 mx-auto bg-luxury-gold/10" />
          <Skeleton className="h-4 w-96 mx-auto bg-luxury-gold/10" />
        </div>

        {/* Main Content: Form + Sidebar */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Personal Details Section */}
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5">
              <Skeleton className="h-6 w-36 bg-luxury-gold/10" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
              </div>
            </div>

            {/* Trip Details Section */}
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5">
              <Skeleton className="h-6 w-28 bg-luxury-gold/10" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
                  <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-luxury-gold/10" />
                <Skeleton className="h-11 w-full rounded-md bg-luxury-gold/10" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
                <Skeleton className="h-20 w-full rounded-md bg-luxury-gold/10" />
              </div>
            </div>

            {/* Addons Section */}
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5">
              <Skeleton className="h-6 w-40 bg-luxury-gold/10" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-luxury-gold/10">
                    <Skeleton className="h-10 w-10 rounded-lg bg-luxury-gold/10 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28 bg-luxury-gold/10" />
                      <Skeleton className="h-3 w-16 bg-luxury-gold/10" />
                    </div>
                    <Skeleton className="h-5 w-10 rounded-full bg-luxury-gold/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-lg border border-luxury-gold/10 bg-luxury-darkGray/60 backdrop-blur-md p-6 space-y-5 lg:sticky lg:top-24">
              <Skeleton className="h-6 w-32 bg-luxury-gold/10" />

              {/* Vehicle Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-luxury-gold/10">
                <Skeleton className="h-16 w-24 rounded-md bg-luxury-gold/10" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-32 bg-luxury-gold/10" />
                  <Skeleton className="h-3 w-20 bg-luxury-gold/10" />
                </div>
              </div>

              {/* Route Info */}
              <div className="space-y-3 pb-4 border-b border-luxury-gold/10">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-40 bg-luxury-gold/10" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-44 bg-luxury-gold/10" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-32 bg-luxury-gold/10" />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pb-4 border-b border-luxury-gold/10">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 bg-luxury-gold/10" />
                  <Skeleton className="h-4 w-14 bg-luxury-gold/10" />
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16 bg-luxury-gold/10" />
                <Skeleton className="h-7 w-24 bg-luxury-gold/10" />
              </div>

              {/* CTA Button */}
              <Skeleton className="h-12 w-full rounded-md bg-luxury-gold/10" />

              {/* Terms */}
              <Skeleton className="h-3 w-full bg-luxury-gold/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
