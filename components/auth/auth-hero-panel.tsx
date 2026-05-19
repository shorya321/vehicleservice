"use client"

import { motion, useReducedMotion } from "motion/react"
import { AuthLogo } from "./auth-logo"

const beats = [
  { index: "01", title: "Saved passenger details" },
  { index: "02", title: "Itinerary archive" },
  { index: "03", title: "Priority assignment" },
]

export function AuthHeroPanel() {
  const reduceMotion = useReducedMotion()

  return (
    <aside className="auth-hero-panel relative overflow-hidden bg-[var(--black-rich)] border-r border-[var(--graphite)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 64% 46% at 50% 0%, rgba(var(--gold-rgb), 0.12) 0%, transparent 68%),
            radial-gradient(ellipse 70% 50% at 15% 35%, rgba(var(--gold-rgb), 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 85%, rgba(var(--gold-rgb), 0.07) 0%, transparent 65%)
          `,
        }}
      />

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
            <div className="editorial-eyebrow">Members</div>
            <h2 className="editorial-headline mt-6">
              One account, every <em>itinerary.</em>
            </h2>
            <p className="editorial-body mt-6 max-w-sm">
              Bookings work without sign-in. With an account, you stop re-entering the same details and keep every receipt in one place.
            </p>
          </motion.div>

          <div
            aria-hidden
            className="h-px w-full max-w-[200px] bg-gradient-to-r from-transparent via-[rgba(var(--gold-rgb),0.18)] to-transparent"
          />

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
