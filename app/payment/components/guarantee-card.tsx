import Link from 'next/link'
import {
  CANCELLATION_POLICY_PATH,
  FREE_CANCELLATION_HOURS,
  NON_REFUNDABLE_LINE,
  REFUND_TIMELINE,
  isFreeCancellationAvailable,
} from '@/lib/bookings/cancellation-policy'

interface GuaranteeCardProps {
  /** Pickup instant. Inside the free window the card says non-refundable instead. */
  pickupDatetime: string
}

export function GuaranteeCard({ pickupDatetime }: GuaranteeCardProps) {
  const isFree = isFreeCancellationAvailable(pickupDatetime)

  return (
    <div className="border-t border-[var(--graphite)] pt-4">
      <div className="t-label">
        Cancellation
      </div>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
        {isFree ? (
          <>
            <span className="text-[var(--success)] font-medium">Free cancellation</span> up to{' '}
            {FREE_CANCELLATION_HOURS} hours before pickup, refunded to your card within {REFUND_TIMELINE}.
          </>
        ) : (
          NON_REFUNDABLE_LINE
        )}{' '}
        Full refund if we cancel your transfer.{' '}
        <Link href={CANCELLATION_POLICY_PATH} className="underline underline-offset-2 hover:text-[var(--gold-text-hover)]">
          Refund policy
        </Link>
      </p>
    </div>
  )
}
