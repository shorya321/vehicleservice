'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { ResultsGuestPicker } from './results-guest-picker'

interface EmptyStateProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    originSlug?: string
    destSlug?: string
  }
}

export function EmptyState({ searchParams }: EmptyStateProps) {
  const reduceMotion = useReducedMotion()

  // Results are filtered by vehicle capacity, so an empty result for a group is just as likely to be
  // "no vehicle big enough" as "route not served on this date". Name both rather than blaming the
  // date, which is all this used to say. Deliberately fleet-agnostic — no hardcoded max capacity.
  const partySize = Math.max(1, parseInt(searchParams.passengers || '1') || 1)
  const isGroup = partySize > 1

  return (
    <motion.div
      className="mx-auto max-w-xl py-20"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="editorial-eyebrow">No results</div>
      <h2 className="editorial-section-title mt-5">
        {isGroup
          ? `No vehicles available for ${partySize} guests`
          : 'No vehicles available for this route'}
      </h2>
      <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        {isGroup
          ? `We may not have a vehicle that seats ${partySize} on this route, or the corridor may not be in the network for your selected date. Try a different date, book two vehicles for a larger group, or talk to support.`
          : 'This corridor may not be in the network for your selected date, or all vehicles are reserved. Try a different date or adjust your search.'}
      </p>

      {/* An over-set party size is the most likely reason a group lands here, so let them fix it in
          place rather than starting again from the home page. */}
      {isGroup && (
        <div className="mt-8 max-w-xs">
          <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Guests
          </div>
          <div className="mt-1.5">
            <ResultsGuestPicker searchParams={searchParams} />
          </div>
        </div>
      )}

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
