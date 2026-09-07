/**
 * The parent segment's skeleton is drawn as the status page's rail and dossier cards. The
 * edit route shares its container and grid but not its shapes: a flat rail beside 52px
 * fields, not two bordered cards. Without this the page would settle by rearranging.
 */
export default function Loading() {
  return (
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        <div
          className="mx-auto max-w-[1100px]"
          aria-busy="true"
          aria-label="Loading your application"
        >
          <div className="skeleton h-3 w-40 rounded-[2px]" />

          <div className="mt-8">
            <div className="skeleton h-2.5 w-40 rounded-[2px]" />
            <div className="skeleton mt-4 h-9 w-[min(22rem,75%)] rounded-[4px]" />
            <div className="skeleton mt-4 h-3 w-[min(28rem,90%)] rounded-[2px]" />
          </div>

          <div className="mt-[clamp(2.5rem,5vw,3.5rem)] lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16 xl:gap-20">
            {/* Rail: chip, the dated rows, then the index and ledger, which are desktop only. */}
            <div>
              <div className="skeleton h-5 w-24 rounded-[4px]" />
              <div className="mt-6">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="flex items-baseline justify-between gap-4 border-t border-[var(--border-subtle)] py-3 last:border-b"
                  >
                    <div className="skeleton h-2.5 w-20 rounded-[2px]" />
                    <div className="skeleton h-3 w-24 rounded-[2px]" />
                  </div>
                ))}
              </div>
              <div className="mt-8 max-lg:hidden">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[2.25rem_1fr] items-baseline gap-x-3.5 border-t border-[var(--graphite)] py-3 last:border-b"
                  >
                    <div className="skeleton h-2.5 w-5 rounded-[2px]" />
                    <div className="skeleton h-3 w-36 rounded-[2px]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Form: three sections, separated by the gold hairline the real sections carry. */}
            <div className="mt-10 lg:mt-0">
              {[4, 4, 5].map((fields, section) => (
                <div
                  key={section}
                  className={
                    section === 0
                      ? ""
                      : "mt-10 border-t border-[rgba(var(--gold-rgb),0.1)] pt-10"
                  }
                >
                  <div className="skeleton h-2.5 w-44 rounded-[2px]" />
                  <div className="skeleton mt-3 h-3 w-[min(30rem,85%)] rounded-[2px]" />
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {Array.from({ length: fields }).map((_, field) => (
                      <div key={field}>
                        <div className="skeleton h-2.5 w-24 rounded-[2px]" />
                        <div className="skeleton mt-2.5 h-[52px] w-full rounded-[4px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-10 border-t border-[rgba(var(--gold-rgb),0.12)] pt-8">
                <div className="skeleton h-[52px] w-[190px] rounded-[4px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
