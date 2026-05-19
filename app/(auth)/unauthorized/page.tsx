import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--black-void)] px-6">
      <div className="w-full max-w-[480px] text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(var(--destructive-rgb),0.1)] text-[rgba(var(--destructive-rgb),1)]">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="editorial-eyebrow">Restricted</div>

        <h1 className="mt-5 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)]">
          Access denied.
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
          You don&rsquo;t have the required permissions to view this page. Please
          sign in with an authorised account.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="btn btn-primary inline-flex h-[52px] items-center justify-center rounded-[4px] px-8"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex h-[52px] items-center justify-center rounded-[4px] border border-[var(--graphite)] px-8 text-[0.875rem] font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--charcoal)] hover:text-[var(--text-primary)]"
          >
            Go to home
          </Link>
        </div>
      </div>
    </main>
  )
}
