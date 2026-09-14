import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for the checkout page.
 *
 * It previously painted with `luxury-black` / `luxury-darkGray`, which resolve but are
 * dark-only hardcodes that never flip with the theme, so in light mode it flashed a black
 * page before a light one loaded. Everything here goes through `[var(--token)]` instead.
 *
 * The shape tracks the shipped page band for band: band 1 on `--ground` carries the back
 * link, the four funnel steps and the heading; band 2 on `--raised` carries the form and
 * the summary; band 3 returns to `--ground` for the three guarantees. It paints the real
 * `.checkout-summary-card` chrome rather than approximating it, so the skeleton cannot
 * drift away from the page it stands in for.
 */
const BAR = 'bg-[var(--charcoal)]'

export default function CheckoutLoading() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
      {/* Band 1 */}
      <section className="editorial-section editorial-section--ground editorial-section--compact">
        <div className="luxury-container">
          <Skeleton className={`h-3.5 w-36 ${BAR}`} />

          {/* Progress: four steps, left-aligned on the rail */}
          <div className="mt-8 flex items-center">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <Skeleton className={`h-3 w-20 ${BAR}`} />
                {i < 3 && <Skeleton className={`h-[1.5px] w-8 sm:w-12 mx-2 sm:mx-3 ${BAR}`} />}
              </div>
            ))}
          </div>

          {/* Heading block */}
          <div className="mt-8 max-w-2xl space-y-5">
            <Skeleton className={`h-3 w-40 ${BAR}`} />
            <Skeleton className={`h-10 w-full max-w-md ${BAR}`} />
            <Skeleton className={`h-5 w-full max-w-xl ${BAR}`} />
          </div>
        </div>
      </section>

      {/* Band 2 */}
      <section className="editorial-section editorial-section--ground grow">
        <div className="luxury-container">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Form column */}
            <div className="flex-1 min-w-0 space-y-10">
              <div className="space-y-6">
                <Skeleton className={`h-3 w-36 ${BAR}`} />

                {/* Vehicle plate */}
                <div className="checkout-vehicle-selected">
                  <Skeleton className={`w-full sm:w-[168px] aspect-[16/9] rounded-[6px] ${BAR}`} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className={`h-2.5 w-24 ${BAR}`} />
                    <Skeleton className={`h-5 w-40 ${BAR}`} />
                    <Skeleton className={`h-3 w-32 ${BAR}`} />
                  </div>
                </div>

                {/* Field pairs */}
                {[0, 1].map((row) => (
                  <div key={row} className="grid md:grid-cols-2 gap-4">
                    {[0, 1].map((col) => (
                      <div key={col} className="space-y-2.5">
                        <Skeleton className={`h-2.5 w-24 ${BAR}`} />
                        <Skeleton className={`h-[52px] w-full rounded-[4px] ${BAR}`} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-6 border-t border-[rgba(var(--gold-rgb),0.1)] pt-10">
                <Skeleton className={`h-3 w-44 ${BAR}`} />
                {[0, 1].map((row) => (
                  <div key={row} className="grid md:grid-cols-2 gap-4">
                    {[0, 1].map((col) => (
                      <div key={col} className="space-y-2.5">
                        <Skeleton className={`h-2.5 w-24 ${BAR}`} />
                        <Skeleton className={`h-[52px] w-full rounded-[4px] ${BAR}`} />
                      </div>
                    ))}
                  </div>
                ))}
                <Skeleton className={`h-[120px] w-full rounded-[4px] ${BAR}`} />
              </div>
            </div>

            {/* Summary card: the real plate */}
            <div className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0">
              {/* Stands in for the Order summary eyebrow, so the two skeleton columns
                  start level the way the real ones do. */}
              <Skeleton className={`h-3 w-36 mb-6 ${BAR}`} />
              <div className="checkout-summary-card">
                <div className="px-6 xl:px-8 py-5 space-y-3">
                  <Skeleton className={`h-2.5 w-24 ${BAR}`} />
                  <Skeleton className={`h-6 w-44 ${BAR}`} />
                  <Skeleton className={`h-4 w-full ${BAR}`} />
                  <Skeleton className={`h-3 w-32 ${BAR}`} />
                </div>
                <div className="border-t border-[var(--stub-line)] px-6 xl:px-8 py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className={`h-2.5 w-12 ${BAR}`} />
                    <Skeleton className={`h-8 w-32 ${BAR}`} />
                  </div>
                  <Skeleton className={`h-3 w-full ${BAR}`} />
                </div>
                <div className="border-t border-[var(--stub-line)] px-6 xl:px-8 py-5 space-y-4">
                  <Skeleton className={`h-[52px] w-full rounded-[8px] ${BAR}`} />
                  <Skeleton className={`h-3 w-40 mx-auto ${BAR}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
