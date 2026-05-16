'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

interface EmptyStateProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function EmptyState({ searchParams }: EmptyStateProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="mx-auto max-w-xl py-20"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="editorial-eyebrow">No results</div>
      <h2 className="editorial-section-title mt-5">
        No vehicles available for this route
      </h2>
      <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        This corridor may not be in the network for your selected date, or all vehicles are reserved. Try a different date or adjust your search. Routes often have more availability on weekdays.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Link href="/" className="btn btn-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          New search
        </Link>
        <Link href="/search" className="editorial-action">
          Explore popular routes
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/contact" className="editorial-action">
          Talk to support
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {(searchParams.from || searchParams.to || searchParams.date) && (
        <>
          <hr className="hairline-gold mt-12" />
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 pt-0 text-[0.8125rem] text-[var(--text-secondary)] sm:grid-cols-4">
          {searchParams.from && (
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">From</dt>
              <dd className="mt-1 truncate">{searchParams.from}</dd>
            </div>
          )}
          {searchParams.to && (
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">To</dt>
              <dd className="mt-1 truncate">{searchParams.to}</dd>
            </div>
          )}
          {searchParams.date && (
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Date</dt>
              <dd className="numeric mt-1">{searchParams.date}</dd>
            </div>
          )}
          {searchParams.passengers && (
            <div>
              <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Passengers</dt>
              <dd className="numeric mt-1">{searchParams.passengers}</dd>
            </div>
          )}
          </dl>
        </>
      )}
    </motion.div>
  )
}
