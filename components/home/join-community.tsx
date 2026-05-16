"use client"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const memberFacts = [
  "Saved passenger details on every booking",
  "Itinerary archive and downloadable receipts",
  "Priority chauffeur assignment on peak routes",
  "Early notice on new cities and vehicle classes",
]

export function JoinCommunity() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="membership-heading"
      className="editorial-section editorial-section--ground relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(var(--gold-rgb), 0.06), transparent)' }}
      />
      <div className="luxury-container relative">
        <motion.div
          className="grid gap-12 md:grid-cols-[1.05fr_minmax(0,0.95fr)] md:gap-20"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-xl">
            <div className="editorial-eyebrow">Membership</div>
            <h2 id="membership-heading" className="editorial-section-title mt-5">
              An account is optional. We recommend one anyway.
            </h2>
            <p className="editorial-body mt-6">
              Bookings work without sign-in. With an account, you don&rsquo;t re-enter the same passenger and contact details on the next trip, and your itineraries stay in one place.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/register" className="btn btn-primary">
                Create an account
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/auth/login" className="editorial-action">
                Already a member
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <ul className="border-t border-[var(--graphite)] pt-2 space-y-0">
            {memberFacts.map((fact, idx) => (
              <motion.li
                key={fact}
                className="flex items-baseline gap-6 border-b border-[var(--graphite)] py-5"
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold-text)] w-6 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[var(--text-secondary)] text-[0.9375rem] leading-relaxed">
                  {fact}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
