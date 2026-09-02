/**
 * The skeleton has to promise the layout that actually arrives. This one used a
 * 4/8 column split, a page title that did not exist, its own padding and the
 * hardcoded luxury-* palette, which renders dark even in light mode. It now
 * mirrors app/account/page.tsx and account-client.tsx: a 280px rail beside the
 * content, on theme tokens, with the shared .skeleton shimmer.
 */
function Bar({ className }: { className?: string }) {
  return <div className={`skeleton rounded-[4px] ${className ?? ""}`} />
}

export default function AccountLoading() {
  return (
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        {/* Page header */}
        <div className="mb-[clamp(2rem,5vw,3rem)] space-y-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-10 w-64 max-w-full" />
          <Bar className="h-4 w-44" />
        </div>

        <div className="account-layout">
          {/* Rail */}
          <div className="hidden lg:block">
            <div className="border-r border-[var(--border-subtle)] pr-8">
              <div className="flex items-center gap-3">
                <Bar className="h-12 w-12 flex-shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bar className="h-4 w-28" />
                  <Bar className="h-3 w-36" />
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Bar key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="account-content space-y-6">
            <div className="space-y-3">
              <Bar className="h-3 w-20" />
              <Bar className="h-8 w-52" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.12)] bg-[var(--black-rich)] p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                    <div className="min-w-0 flex-1 space-y-3">
                      <Bar className="h-3 w-40" />
                      <Bar className="h-5 w-3/5" />
                      <Bar className="h-5 w-2/5" />
                    </div>
                    <Bar className="h-7 w-24 flex-shrink-0" />
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
