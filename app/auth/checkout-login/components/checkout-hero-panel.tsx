"use client"

import Link from "next/link"

interface CheckoutHeroPanelProps {
  from?: string | null
  to?: string | null
  date?: string | null
  passengers?: string | null
}

export function CheckoutHeroPanel({ from, to, date, passengers }: CheckoutHeroPanelProps) {
  const details: { index: string; label: string; value: string }[] = []
  let counter = 1

  if (from) {
    details.push({ index: String(counter).padStart(2, "0"), label: "Pick-up", value: from })
    counter++
  }
  if (to) {
    details.push({ index: String(counter).padStart(2, "0"), label: "Drop-off", value: to })
    counter++
  }
  if (date) {
    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    details.push({ index: String(counter).padStart(2, "0"), label: "Date", value: formattedDate })
    counter++
  }
  if (passengers) {
    details.push({
      index: String(counter).padStart(2, "0"),
      label: "Passengers",
      value: `${passengers} passenger${parseInt(passengers) !== 1 ? "s" : ""}`,
    })
  }

  return (
    <aside aria-label="Booking summary" className="auth-hero-panel relative overflow-hidden">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-10 pb-10 lg:px-12 lg:pb-12">
        <div className="my-auto flex flex-col gap-12 lg:gap-14">
          <div className="max-w-md">
            <div className="editorial-eyebrow">Secure checkout</div>
            <h2 className="editorial-headline mt-6">
              Complete your <em>booking.</em>
            </h2>
            <p className="editorial-body mt-6 max-w-sm">
              You&apos;re one step away from confirming your transfer.
              Sign in or create an account to continue.
            </p>
          </div>

          <div aria-hidden="true" className="h-px w-full bg-[var(--graphite)]" />

          {details.length > 0 && (
            <div className="max-w-md">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[0.6875rem] font-semibold tracking-[0.15em] uppercase text-[var(--gold-text)]">
                  Your booking
                </span>
                <Link
                  href="/"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors"
                >
                  Edit search
                </Link>
              </div>

              <ol className="space-y-0">
                {details.map((item) => (
                  <li
                    key={item.index}
                    className="flex items-center gap-4 border-t border-[var(--graphite)] py-4"
                  >
                    <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold-text)]">
                      {item.index}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-[var(--text-muted)]">
                        {item.label}
                      </span>
                      <span className="auth-beat-title">
                        {item.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
