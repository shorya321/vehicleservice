"use client"

import { motion, useReducedMotion } from "motion/react"
import { AuthLogo } from "./auth-logo"
import { memberBeats } from "./auth-hero-data"
import { AUTH_EASE, fadeUp } from "@/lib/auth/motion"

interface AuthHeroPanelProps {
  animated?: boolean
}

export function AuthHeroPanel({ animated = true }: AuthHeroPanelProps) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = animated && !reduceMotion

  if (!shouldAnimate) {
    return (
      <aside aria-label="Membership benefits" className="auth-hero-panel relative">
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
                  <span className="numeric text-[0.875rem] font-semibold tracking-[0.12em] text-[var(--gold-text)]">
                    {beat.index}
                  </span>
                  <div>
                    <p className="auth-beat-title">{beat.title}</p>
                    <p className="mt-1 auth-beat-body">{beat.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside aria-label="Membership benefits" className="auth-hero-panel relative">
      <div className="relative z-10 flex flex-1 flex-col items-center p-8 lg:p-12">
        <motion.div className="w-full max-w-md" {...fadeUp(0, reduceMotion)}>
          <AuthLogo className="text-2xl" />
        </motion.div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <motion.div className="max-w-md" {...fadeUp(0.1, reduceMotion)}>
            <div className="editorial-eyebrow">Members</div>
            <h2 className="editorial-headline mt-4">
              One account, every <em>itinerary.</em>
            </h2>
            <p className="editorial-body mt-4 max-w-sm">
              Bookings work without sign-in. With an account, you stop re-entering the same details and keep every receipt in one place.
            </p>
          </motion.div>

          <motion.ol className="max-w-md space-y-0" {...fadeUp(0.2, reduceMotion)}>
            {memberBeats.map((beat, i) => (
              <motion.li
                key={beat.index}
                className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-[var(--graphite)] py-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: AUTH_EASE }}
              >
                <span className="numeric text-[0.875rem] font-semibold tracking-[0.12em] text-[var(--gold-text)]">
                  {beat.index}
                </span>
                <div>
                  <p className="auth-beat-title">{beat.title}</p>
                  <p className="mt-1 auth-beat-body">{beat.body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </aside>
  )
}
