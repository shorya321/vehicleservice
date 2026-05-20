"use client"

import { motion, useReducedMotion } from "motion/react"
import { AuthLogo } from "./auth-logo"

const beats = [
  { index: "01", title: "Passenger details, saved" },
  { index: "02", title: "Every receipt, one archive" },
  { index: "03", title: "Priority chauffeur assignment" },
]

export function AuthHeroPanel() {
  const reduceMotion = useReducedMotion()

  return (
    <aside className="auth-hero-panel relative overflow-hidden border-r border-[var(--graphite)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 auth-hero-glow" />

      <motion.div
        className="absolute left-10 top-10 z-10 lg:left-12 lg:top-12"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <AuthLogo className="text-2xl" />
      </motion.div>

      <div aria-hidden className="shrink-0 h-16 lg:h-20" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-10 pb-10 lg:px-12 lg:pb-12">
        <div className="my-auto flex flex-col gap-12 lg:gap-14">
          <motion.div
            className="max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="editorial-eyebrow">Your account</div>
            <h2 className="editorial-headline mt-6">
              One account, every <em>itinerary.</em>
            </h2>
            <p className="editorial-body mt-6 max-w-sm">
              Bookings work without sign-in. With an account, you stop re-entering the same details and keep every receipt in one place.
            </p>
          </motion.div>

          <div aria-hidden className="auth-hero-divider" />

          <motion.ol
            className="max-w-md space-y-4"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {beats.map((beat) => (
              <li key={beat.index} className="flex items-center gap-4 border-t border-[var(--graphite)] pt-4">
                <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold)]">
                  {beat.index}
                </span>
                <p className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
                  {beat.title}
                </p>
              </li>
            ))}
          </motion.ol>
        </div>
      </div>
    </aside>
  )
}
