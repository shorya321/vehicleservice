/**
 * Detail-shaped, not list-shaped. app/account/loading.tsx draws the bookings list and would
 * flash the wrong layout on the way into a single booking.
 */
export default function BookingDetailLoading() {
  return (
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        <div className="account-layout">
          <div className="hidden lg:block">
            <div className="skeleton h-[420px] w-full rounded-[8px]" />
          </div>

          <div className="account-content" role="status" aria-label="Loading booking">
            <span className="sr-only">Loading booking</span>
            <div className="skeleton h-3 w-28 rounded-[2px]" />
            <div className="skeleton mt-6 h-9 w-2/3 rounded-[4px]" />
            <div className="skeleton mt-3 h-4 w-40 rounded-[2px]" />

            <div className="mt-8 flex flex-col items-start gap-8 xl:flex-row xl:gap-10">
              <div className="min-w-0 flex-1 space-y-8">
                <div className="skeleton h-[340px] w-full rounded-[8px]" />
                <div className="skeleton h-[150px] w-full rounded-[8px]" />
              </div>
              <div className="w-full xl:w-[360px] xl:flex-shrink-0 space-y-8">
                <div className="skeleton h-[300px] w-full rounded-[8px]" />
                <div className="skeleton h-[180px] w-full rounded-[8px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
