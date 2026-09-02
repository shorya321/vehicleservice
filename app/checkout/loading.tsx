import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for the checkout page.
 *
 * It previously painted with `luxury-black` / `luxury-darkGray`, which resolve but are
 * dark-only hardcodes that never flip with the theme, so in light mode it flashed a black
 * page before a light one loaded. Everything here goes through `[var(--token)]` instead,
 * and the shape matches the shipped page: four funnel steps, a left-aligned eyebrow and
 * heading, a flat form column and the summary card.
 */
export default function CheckoutLoading() {
  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      <div className="luxury-container py-8 md:py-16 lg:py-20">
        {/* Progress: four steps, left-aligned on the rail */}
        <div className="mb-12 flex items-center">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-3 w-20 bg-[var(--charcoal)]" />
              {i < 3 && <Skeleton className="h-[1.5px] w-8 sm:w-12 mx-2 sm:mx-3 bg-[var(--charcoal)]" />}
            </div>
          ))}
        </div>

        {/* Heading block */}
        <div className="mb-12 space-y-4">
          <Skeleton className="h-3 w-40 bg-[var(--charcoal)]" />
          <Skeleton className="h-10 w-full max-w-md bg-[var(--charcoal)]" />
          <Skeleton className="h-5 w-full max-w-xl bg-[var(--charcoal)]" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Form column */}
          <div className="flex-1 min-w-0 space-y-10">
            <div className="space-y-6">
              <Skeleton className="h-3 w-36 bg-[var(--charcoal)]" />

              {/* Route rail */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-[var(--graphite)] pt-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2.5">
                    <Skeleton className="h-2.5 w-16 bg-[var(--charcoal)]" />
                    <Skeleton className="h-5 w-28 bg-[var(--charcoal)]" />
                  </div>
                ))}
              </div>

              {/* Vehicle */}
              <div className="flex gap-4 items-center border-t border-[rgba(var(--gold-rgb),0.1)] pt-5">
                <Skeleton className="w-full sm:w-[168px] aspect-[16/9] rounded-[4px] bg-[var(--charcoal)]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-2.5 w-24 bg-[var(--charcoal)]" />
                  <Skeleton className="h-5 w-40 bg-[var(--charcoal)]" />
                  <Skeleton className="h-3 w-32 bg-[var(--charcoal)]" />
                </div>
              </div>

              {/* Field pairs */}
              {[0, 1].map((row) => (
                <div key={row} className="grid md:grid-cols-2 gap-4">
                  {[0, 1].map((col) => (
                    <div key={col} className="space-y-2.5">
                      <Skeleton className="h-2.5 w-24 bg-[var(--charcoal)]" />
                      <Skeleton className="h-[52px] w-full rounded-[4px] bg-[var(--charcoal)]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-6 border-t border-[rgba(var(--gold-rgb),0.1)] pt-10">
              <Skeleton className="h-3 w-44 bg-[var(--charcoal)]" />
              {[0, 1].map((row) => (
                <div key={row} className="grid md:grid-cols-2 gap-4">
                  {[0, 1].map((col) => (
                    <div key={col} className="space-y-2.5">
                      <Skeleton className="h-2.5 w-24 bg-[var(--charcoal)]" />
                      <Skeleton className="h-[52px] w-full rounded-[4px] bg-[var(--charcoal)]" />
                    </div>
                  ))}
                </div>
              ))}
              <Skeleton className="h-[120px] w-full rounded-[4px] bg-[var(--charcoal)]" />
            </div>
          </div>

          {/* Summary card */}
          <div className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0">
            <div className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.12)] bg-[var(--black-rich)] overflow-hidden">
              <div className="px-6 xl:px-8 py-5 space-y-3">
                <Skeleton className="h-2.5 w-24 bg-[var(--charcoal)]" />
                <Skeleton className="h-6 w-44 bg-[var(--charcoal)]" />
                <Skeleton className="h-4 w-full bg-[var(--charcoal)]" />
                <Skeleton className="h-3 w-32 bg-[var(--charcoal)]" />
              </div>
              <div className="border-t border-[rgba(var(--gold-rgb),0.15)] px-6 xl:px-8 py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-12 bg-[var(--charcoal)]" />
                  <Skeleton className="h-8 w-32 bg-[var(--charcoal)]" />
                </div>
                <Skeleton className="h-3 w-full bg-[var(--charcoal)]" />
              </div>
              <div className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-5 space-y-4">
                <Skeleton className="h-[52px] w-full rounded-[4px] bg-[var(--charcoal)]" />
                <Skeleton className="h-3 w-40 mx-auto bg-[var(--charcoal)]" />
              </div>
            </div>

            {/* Reassurance block, now under its own section header */}
            <div className="mt-8">
              <Skeleton className="h-3 w-52 bg-[var(--charcoal)]" />
              <div className="mt-5 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border-b border-[var(--graphite)] pb-4 space-y-2">
                    <Skeleton className="h-2.5 w-24 bg-[var(--charcoal)]" />
                    <Skeleton className="h-4 w-full bg-[var(--charcoal)]" />
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
