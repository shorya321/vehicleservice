import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Stands in for the application form when nobody is signed in.
 *
 * Applying needs a customer account, because the application is bound to the
 * signed-in user. Sign-up does not carry a return address, so the last line says
 * where the form lives once the account exists.
 */
export function GuestApplyPanel() {
  return (
    <section className="checkout-summary-card" aria-labelledby="vendor-guest-heading">
      <div className="checkout-stub-cap">
        <h2 id="vendor-guest-heading" className="checkout-stub-ref">
          Apply to partner
        </h2>
        <span className="checkout-stub-ref">Account needed</span>
      </div>
      <div className="checkout-stub-perf" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="p-6 md:p-8 pt-4 md:pt-5">
        <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-[44ch]">
          The application is linked to your account, so you can follow its review and
          open your vendor dashboard once approved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="checkout-btn-primary">
            Create account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/login?redirect=/become-vendor" className="checkout-btn-secondary">
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[var(--text-muted)]">
          New here? After you register and sign in, open <strong>Partner with us</strong> from
          your account menu to start the application.
        </p>
      </div>
    </section>
  )
}
