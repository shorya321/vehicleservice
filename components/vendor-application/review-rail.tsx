'use client'

import Link from 'next/link'
import { useReducedMotion } from 'motion/react'
import {
  BAND,
  BAND_DIVIDER,
  CARD,
  CARD_LABEL,
  CardMotion,
  GHOST_BUTTON,
  RouteStop,
} from '@/components/booking/itinerary-primitives'
import { formatBookingDate } from '@/lib/utils/timezone'
import {
  APPLICATION_STATUS_LABEL,
  decisionDueAt,
  REVIEW_WINDOW_HOURS,
  type ApplicationStatus,
} from '@/lib/vendor-application/status'

interface ReviewRailProps {
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  className?: string
}

const GUIDANCE: Record<ApplicationStatus, string> = {
  pending: `Every detail stays editable until a decision is made. We review inside ${REVIEW_WINDOW_HOURS} hours.`,
  approved: 'Add your vehicles and payout details to start taking bookings.',
  rejected: 'Our team can tell you exactly what to change before you apply again.',
}

/**
 * The review rail.
 *
 * Drawn with RouteStop, the same hairline rail that carries pickup to dropoff on a booking: dots
 * and a connector, no icons. It replaced a tinted banner, a duplicate status badge and a sentence
 * of prose that carried the 48 hour promise. Here the promise is a dated stop.
 */
export function ReviewRail({ status, createdAt, updatedAt, reviewedAt, className }: ReviewRailProps) {
  const reduceMotion = useReducedMotion() ?? false
  const decided = status !== 'pending'
  const decidedAt = reviewedAt ?? updatedAt
  const edited = updatedAt > createdAt

  return (
    <CardMotion
      reduceMotion={reduceMotion}
      delay={0.05}
      aria-labelledby="review-heading"
      className={`${CARD} ${className ?? ''}`}
    >
      <div className={`${BAND} flex items-center justify-between gap-4 border-b border-[rgba(var(--gold-rgb),0.1)]`}>
        <h2 id="review-heading" className={CARD_LABEL}>
          Review
        </h2>
        <span className={`account-chip ${status === 'rejected' ? 'account-chip-alert' : ''}`}>
          {APPLICATION_STATUS_LABEL[status]}
        </span>
      </div>

      <div className={BAND}>
        <ol className="space-y-5">
          <RouteStop
            label="Submitted"
            meta={formatBookingDate(createdAt)}
            state="done"
            reduceMotion={reduceMotion}
          />
          <RouteStop
            label="In review"
            meta={
              decided
                ? undefined
                : edited
                  ? `Updated ${formatBookingDate(updatedAt)}`
                  : `Since ${formatBookingDate(createdAt)}`
            }
            state="done"
            reduceMotion={reduceMotion}
          />
          <RouteStop
            label={decided ? APPLICATION_STATUS_LABEL[status] : 'Decision'}
            meta={
              decided
                ? formatBookingDate(decidedAt)
                : `Expected by ${formatBookingDate(decisionDueAt(createdAt).toISOString())}`
            }
            state={decided ? 'done' : 'pending'}
            terminal
            reduceMotion={reduceMotion}
          />
        </ol>
      </div>

      <div className={`${BAND_DIVIDER} ${BAND}`}>
        <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{GUIDANCE[status]}</p>

        <div className="mt-5 flex flex-col gap-3">
          {status === 'pending' && (
            <Link href="/vendor-application/edit" className="btn btn-primary w-full justify-center">
              Edit details
            </Link>
          )}
          {status === 'approved' && (
            <Link href="/vendor/profile" className="btn btn-primary w-full justify-center">
              Complete your profile
            </Link>
          )}
          <Link href="/contact" className={`${GHOST_BUTTON} w-full justify-center`}>
            Contact support
          </Link>
        </div>
      </div>
    </CardMotion>
  )
}
