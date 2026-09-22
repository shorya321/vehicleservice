'use client'

import Link from 'next/link'
import { useReducedMotion } from 'motion/react'
import { CardMotion, GHOST_BUTTON, RouteStop } from '@/components/booking/itinerary-primitives'
import { RouteConnector } from '@/app/search/results/components/route-connector'
import { formatBookingDate } from '@/lib/utils/timezone'
import {
  APPLICATION_STATUS_LABEL,
  decisionDueAt,
  REVIEW_WINDOW_HOURS,
  type ApplicationStatus,
} from '@/lib/vendor-application/status'
import { STUB_BODY, STUB_PLATE, StubPerf } from './stub-plate'

interface ReviewRailProps {
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  reviewedAt: string | null
  /** True once a decision has been answered and the row put back in the queue. */
  resubmitted?: boolean
  className?: string
}

const GUIDANCE: Record<ApplicationStatus, string> = {
  pending: `Every detail stays editable until a decision is made. We review inside ${REVIEW_WINDOW_HOURS} hours.`,
  approved: 'Add your vehicles and payout details to start taking bookings.',
  rejected: 'Answer the decision above and resubmit. You keep the same application and the same reference.',
}

/** Weekday first, the way the checkout stub dates a trip. */
const ROUTE_DATE = 'EEE d MMM'

/** The rail's hollow Decision dot is punched through the stub plate, not the flat card tone. */
const HOLLOW_ON_PLATE = 'bg-[var(--stub-mid)]'

/**
 * The review rail.
 *
 * Drawn on the checkout stub that become-vendor's form and after-submit card use: the cap, then
 * the review as a route (submitted to decision) on the search and checkout connector, then the
 * tear, the three dated stops, a second tear and the actions. The stops are RouteStop, the same
 * hairline rail that carries pickup to dropoff on a booking: dots and a connector, no icons.
 */
export function ReviewRail({
  status,
  createdAt,
  updatedAt,
  reviewedAt,
  resubmitted = false,
  className,
}: ReviewRailProps) {
  const reduceMotion = useReducedMotion() ?? false
  const decided = status !== 'pending'
  const decidedAt = reviewedAt ?? updatedAt
  const edited = updatedAt > createdAt

  return (
    <CardMotion
      reduceMotion={reduceMotion}
      delay={0.05}
      aria-labelledby="review-heading"
      className={`${STUB_PLATE} ${className ?? ''}`}
    >
      <div className="checkout-stub-cap">
        <h2 id="review-heading" className="checkout-stub-ref">
          Review
        </h2>
        <span className={`account-chip self-center ${status === 'rejected' ? 'account-chip-alert' : ''}`}>
          {APPLICATION_STATUS_LABEL[status]}
        </span>
      </div>

      <div className="px-6 pb-6 pt-4">
        <p className="checkout-stub-route">
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">Submitted</span>
            <span className="checkout-stub-route__note">{formatBookingDate(createdAt, ROUTE_DATE)}</span>
          </span>
          <RouteConnector />
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">
              {decided ? APPLICATION_STATUS_LABEL[status] : 'Decision'}
            </span>
            <span className="checkout-stub-route__note">
              {decided
                ? formatBookingDate(decidedAt, ROUTE_DATE)
                : `By ${formatBookingDate(decisionDueAt(createdAt).toISOString(), ROUTE_DATE)}`}
            </span>
          </span>
        </p>
        {!decided && (
          <p className="checkout-stub-facts">
            <span>
              <strong>{REVIEW_WINDOW_HOURS} hours</strong> review window
            </span>
            <span>Editable until then</span>
          </p>
        )}
      </div>

      <StubPerf />

      <div className={STUB_BODY}>
        <ol className="space-y-5">
          <RouteStop
            label="Submitted"
            meta={formatBookingDate(createdAt)}
            state="done"
            reduceMotion={reduceMotion}
          />
          <RouteStop
            label={resubmitted && !decided ? 'Resubmitted' : 'In review'}
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
            hollowClassName={HOLLOW_ON_PLATE}
            terminal
            reduceMotion={reduceMotion}
          />
        </ol>
      </div>

      <StubPerf />

      <div className={STUB_BODY}>
        <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{GUIDANCE[status]}</p>

        <div className="mt-5 flex flex-col gap-3">
          {status === 'pending' && (
            <Link href="/vendor-application/edit" className="btn btn-primary w-full justify-center">
              Edit details
            </Link>
          )}
          {status === 'rejected' && (
            <Link href="/vendor-application/edit" className="btn btn-primary w-full justify-center">
              Update and resubmit
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
