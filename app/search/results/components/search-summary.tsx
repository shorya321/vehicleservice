'use client'

import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'

interface Location {
  id: string
  name: string
  city: string | null
  country_code: string
  slug: string
}

interface SearchSummaryProps {
  origin: Location | null
  destination: Location | null
  date: Date
  passengers: number
}

export function SearchSummary({ origin, destination, date, passengers }: SearchSummaryProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      className="relative border-b border-[var(--graphite)]"
      style={{ background: 'linear-gradient(180deg, var(--black-rich) 0%, var(--black-void) 100%)' }}
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="luxury-container py-10 lg:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          New search
        </Link>

        <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-[2fr_1fr_1fr] sm:items-end">
          <div>
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Route
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-[-0.015em] text-[var(--text-primary)]">
                {origin?.city || origin?.name || 'Unknown'}
              </span>
              <span className="text-[1.25rem] text-[var(--gold-text)]" aria-hidden="true">→</span>
              <span className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-[-0.015em] text-[var(--text-primary)]">
                {destination?.city || destination?.name || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="border-t border-[var(--graphite)] pt-4 sm:border-t-0 sm:border-l sm:border-[var(--graphite)] sm:pl-8 sm:pt-0">
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Date
            </div>
            <div className="numeric mt-2 text-[1.125rem] text-[var(--text-primary)]">
              {format(date, 'EEE · d MMM yyyy')}
            </div>
          </div>

          <div className="border-t border-[var(--graphite)] pt-4 sm:border-t-0 sm:border-l sm:border-[var(--graphite)] sm:pl-8 sm:pt-0">
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Passengers
            </div>
            <div className="numeric mt-2 text-[1.125rem] text-[var(--text-primary)]">
              {passengers} <span className="ml-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">passengers</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
