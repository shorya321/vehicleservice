/**
 * Segment skeleton for /booking/*.
 *
 * Mirrors the confirmation page's actual shape: centred hero, then a two-column split with the
 * payment summary in the right rail. The previous version was single-column at max-w-2xl and
 * painted with the retired `luxury-*` utilities and a backdrop blur, so the first frame of the
 * most important page in the product contradicted the page it was loading.
 */
function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[4px] bg-[rgba(var(--gold-rgb),0.08)] ${className ?? ''}`} />
}

const CARD = 'bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden'
const BAND = 'px-6 xl:px-8 py-5'
const BAND_DIVIDER = 'border-t border-[rgba(var(--gold-rgb),0.1)]'

function CardSkeleton({ bands }: { bands: number }) {
  return (
    <div className={CARD}>
      <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
        <Bar className="h-2.5 w-28" />
      </div>
      {Array.from({ length: bands }).map((_, i) => (
        <div key={i} className={`${BAND} ${i > 0 ? BAND_DIVIDER : ''}`}>
          <Bar className="h-2.5 w-20" />
          <Bar className="mt-2.5 h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export default function BookingLoading() {
  return (
    <div className="bg-[var(--black-void)] pb-[clamp(4rem,9vw,6.5rem)] pt-[clamp(3rem,7vw,5rem)]">
      <div className="luxury-container max-w-6xl">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="h-16 w-16 animate-pulse rounded-full border border-[rgba(var(--gold-rgb),0.12)]" />
          <Bar className="mt-7 h-2.5 w-24" />
          <Bar className="mt-5 h-10 w-full max-w-md" />
          <Bar className="mt-5 h-4 w-4/5" />
          <Bar className="mt-8 h-5 w-44" />
        </div>

        <div className="mt-[clamp(3rem,7vw,4.5rem)] flex flex-col items-start gap-8 lg:flex-row lg:gap-10">
          <div className="min-w-0 flex-1 space-y-8">
            <CardSkeleton bands={3} />
            <CardSkeleton bands={1} />
          </div>
          <div className="hidden w-[380px] flex-shrink-0 lg:block xl:w-[420px]">
            <CardSkeleton bands={2} />
          </div>
        </div>
      </div>
    </div>
  )
}
