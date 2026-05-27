import { AuthLogo } from "./auth-logo"
import { memberBeats } from "./auth-hero-data"

export function AuthHeroPanelStatic() {
  return (
    <aside aria-label="Membership benefits" className="auth-hero-panel relative border-r border-[var(--graphite)] bg-[var(--black-void)]">
      <div className="relative z-10 flex flex-1 flex-col items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <AuthLogo className="text-2xl" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="max-w-md">
            <div className="editorial-eyebrow">Members</div>
            <h2 className="editorial-headline mt-4">
              One account, every <em>itinerary.</em>
            </h2>
            <p className="editorial-body mt-4 max-w-sm">
              Bookings work without sign-in. With an account, you stop re-entering the same details and keep every receipt in one place.
            </p>
          </div>

          <ol className="max-w-md space-y-0">
            {memberBeats.map((beat) => (
              <li key={beat.index} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-[var(--graphite)] py-4">
                <span className="numeric text-[0.875rem] font-semibold tracking-[0.12em] text-[var(--gold)]">
                  {beat.index}
                </span>
                <div>
                  <p className="text-[0.9375rem] font-medium leading-snug text-[var(--text-primary)]">
                    {beat.title}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                    {beat.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  )
}
