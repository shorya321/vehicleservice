import { AuthLogo } from "./auth-logo"

interface MemberBeat {
  index: string
  title: string
  body: string
}

const beats: MemberBeat[] = [
  {
    index: "01",
    title: "Saved passenger details",
    body: "Names, phone, and pickup notes pre-fill on every future booking. Edit once, never again.",
  },
  {
    index: "02",
    title: "Itinerary archive",
    body: "Every confirmed transfer in one place. Download a PDF receipt for any past booking, anytime.",
  },
  {
    index: "03",
    title: "Priority assignment",
    body: "Held places on peak-hour airport runs and on routes operating near capacity.",
  },
]

export function AuthHeroStatic() {
  return (
    <aside className="auth-hero-panel relative overflow-hidden bg-[var(--black-void)]">
      <div className="relative z-10 flex h-full flex-col justify-between gap-16 p-12 lg:p-16">
        <div>
          <AuthLogo className="text-2xl" />
        </div>

        <div className="max-w-md">
          <div className="editorial-eyebrow">Members</div>
          <h2 className="editorial-headline mt-6">
            One account, every <em>itinerary.</em>
          </h2>
          <p className="editorial-body mt-6 max-w-sm">
            Bookings work without sign-in. With an account, you stop re-entering the same details and keep every receipt in one place.
          </p>
        </div>

        <hr aria-hidden className="max-w-[200px] border-t border-[var(--graphite)]" />

        <ol className="max-w-md space-y-6">
          {beats.map((beat) => (
            <li key={beat.index} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-[var(--graphite)] pt-4">
              <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold)]">
                {beat.index}
              </span>
              <div>
                <p className="text-[1.0625rem] font-medium leading-snug text-[var(--text-primary)]">
                  {beat.title}
                </p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
                  {beat.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
