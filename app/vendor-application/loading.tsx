/**
 * The route is force-dynamic and awaits three Supabase round trips, so without this the
 * transition from /account holds on a blank screen. Shapes match the rail and dossier so the
 * page settles into place rather than appearing.
 */
export default function Loading() {
  return (
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        <div className="mx-auto max-w-[1100px]" aria-busy="true" aria-label="Loading your application">
          <div className="skeleton h-3 w-28 rounded-[2px]" />

          <div className="mt-8">
            <div className="skeleton h-2.5 w-40 rounded-[2px]" />
            <div className="skeleton mt-4 h-9 w-[min(20rem,70%)] rounded-[4px]" />
            <div className="skeleton mt-4 h-3 w-48 rounded-[2px]" />
          </div>

          <div className="mt-[clamp(2.5rem,5vw,3.5rem)] lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16 xl:gap-20">
            <div className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.12)] bg-[var(--black-rich)]">
              <div className="border-b border-[rgba(var(--gold-rgb),0.1)] px-6 py-5 xl:px-8">
                <div className="skeleton h-2.5 w-20 rounded-[2px]" />
              </div>
              <div className="space-y-6 px-6 py-5 xl:px-8">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pl-7">
                    <div className="skeleton h-2.5 w-24 rounded-[2px]" />
                    <div className="skeleton mt-2 h-3.5 w-32 rounded-[2px]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 space-y-6 lg:mt-0">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.12)] bg-[var(--black-rich)]"
                >
                  <div className="border-b border-[rgba(var(--gold-rgb),0.1)] px-6 py-5 xl:px-8">
                    <div className="skeleton h-2.5 w-24 rounded-[2px]" />
                  </div>
                  <div className="grid gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2 xl:px-8">
                    {[0, 1, 2, 3].map((field) => (
                      <div key={field}>
                        <div className="skeleton h-2.5 w-20 rounded-[2px]" />
                        <div className="skeleton mt-2 h-4 w-32 rounded-[2px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
