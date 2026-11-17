import { RouteBandMap } from './route-band-map'

/**
 * The search page at rest, before the server query returns.
 *
 * A server component with no motion on purpose: a skeleton that animates in is
 * a skeleton you see twice. It paints the real `.route-band`, `.trip-ledger`,
 * `.results-strip`, `.results-bar` and `.results-card` chrome with pulsing blocks inside, so it cannot drift out
 * of sync with the page the way its predecessor did, which skeletoned a summary
 * bar that no longer exists and a 4/3 plate on a 16/9 card.
 *
 * The map is the real one too, not a pulsing block: it is the same static
 * markup the loaded page shows, so the band does not visibly redraw underneath
 * the content when the query returns.
 */
function Bar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded bg-[rgba(var(--text-primary-rgb),0.08)] ${className ?? ''}`}
      style={style}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="results-card">
      <div className="results-card__photo animate-pulse bg-[rgba(var(--text-primary-rgb),0.06)]" />
      <div className="results-card__body gap-2.5">
        <Bar className="h-2.5 w-16" />
        <Bar className="h-5 w-36" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-3/4" />
        <div className="mt-2 flex gap-1.5">
          <Bar className="h-7 w-28 rounded-full" />
          <Bar className="h-7 w-16 rounded-full" />
        </div>
        <div className="results-card__foot">
          <Bar className="h-7 w-24" />
          <Bar className="h-11 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** One class tile in the strip: name and count, then the from-price. */
function TileSkeleton() {
  return (
    <div className="results-tile">
      <Bar className="h-3.5 w-20" />
      <Bar className="h-3 w-24" />
    </div>
  )
}

export function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--black-void)]">
      <section className="route-band editorial-section editorial-section--ground editorial-section--compact">
        <RouteBandMap />

        <div className="luxury-container relative z-10">
          <Bar className="h-3 w-24" />
          <div className="mt-8 max-w-2xl">
            <Bar className="h-3 w-20" />
            <Bar className="mt-5 h-9 w-full max-w-lg" />
            <Bar className="mt-4 h-3.5 w-56" />
          </div>

          <div className="trip-ledger mt-10">
            {[
              { label: 'w-8', value: 'w-28' },
              { label: 'w-12', value: 'w-20' },
              { label: 'w-14', value: 'w-16' },
            ].map((row) => (
              <div key={row.label} className="trip-ledger__item">
                <Bar className={`h-2.5 ${row.label}`} />
                <Bar className={`h-4 ${row.value}`} />
              </div>
            ))}

            <div className="trip-ledger__item trip-ledger__item--price">
              <Bar className="h-2.5 w-8" />
              <Bar className="h-7 w-28" />
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--raised results-fleet">
        <div className="luxury-container">
          <div className="max-w-2xl">
            <Bar className="h-3 w-20" />
            <Bar className="mt-5 h-9 w-full max-w-md" />
            <Bar className="mt-6 h-4 w-full max-w-lg" />
          </div>

          <div className="mt-12">
            <div className="results-strip scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => (
                <TileSkeleton key={i} />
              ))}
            </div>

            <div className="results-bar">
              {[110, 110, 80].map((w, i) => (
                <Bar key={i} className="h-10 rounded-full" style={{ width: w }} />
              ))}
              <Bar className="ml-auto h-11 w-44 rounded-full" />
            </div>

            <div className="results-count">
              <Bar className="h-4 w-24" />
            </div>

            <div className="results-groups">
              <div className="results-group">
                <Bar className="h-6 w-40" />
                <div className="results-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
