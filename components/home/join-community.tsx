"use client"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

// Matches --ease-luxury. Typed as a tuple because inside a variants object the
// literal would widen to number[], which motion's Easing type rejects.
const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1]

const memberFacts = [
  "Return bookings in seconds, your details already on file",
  "Rebook a past route in two taps",
  "Every trip on record: city, route, date, vehicle",
  "Priority support with no queue",
]

export function JoinCommunity() {
  const reduceMotion = useReducedMotion()

  // One timeline for the ledger. The rows previously carried their own
  // `whileInView` alongside the container's, on a different viewport threshold,
  // so on a fast scroll they could animate out of step with the block they sit
  // in. `whileInView` is always supplied and reduced motion collapses the
  // duration and offset; see components/home/cities.tsx for why the
  // `reduceMotion ? undefined : ...` shape leaves the section invisible.
  const rail = {
    hidden: {},
    shown: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } },
  }

  const row = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -8 },
    shown: {
      opacity: 1,
      x: 0,
      transition: { duration: reduceMotion ? 0 : 0.4, ease: EASE_LUXURY },
    },
  }

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
        <div className="editorial-split">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="editorial-eyebrow">Your account</div>
            <h2 id="membership-heading" className="editorial-section-title mt-5">
              One signup.{" "}
              <span className="md:block">Every ride faster after that.</span>
            </h2>
            <p className="editorial-body mt-6">
              A free account is part of every first booking. From there, your past routes, passenger details, and receipts stay in one place, and return transfers book in seconds.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/register" className="btn btn-primary">
                Create your free account
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/auth/login" className="editorial-action editorial-action--paired">
                Sign in
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* The two facts that answer the objections at the click. They were
                buried mid-paragraph, four lines above the button. */}
            <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
              Free, and about a minute.
            </p>
          </motion.div>

          <motion.ul
            className="editorial-list editorial-split__rail"
            variants={rail}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.2 }}
          >
            {memberFacts.map((fact, idx) => (
              <motion.li key={fact} variants={row}>
                <span className="editorial-list-index numeric">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="editorial-list-title">{fact}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}
