"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cancelBooking } from "@/app/account/booking-actions"

/**
 * Cancellation, stated rather than alarmed.
 *
 * The drawer drew this as a red-tinted button above a red confirm panel, which DESIGN.md section 6
 * rules out: trust here is the absence of suspicion-triggering patterns. The destructive step is
 * still deliberate and still two-stage, it just no longer shouts at a customer who came to look at
 * an upcoming trip.
 */
export function BookingCancelAction({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)
    const result = await cancelBooking(bookingId)
    setIsCancelling(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Booking cancelled")
    setConfirming(false)
    // The server action revalidates this route; refresh pulls the cancelled record back in place
    // so the customer sees the outcome here rather than being bounced to the list.
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="editorial-action min-h-[44px] !text-[var(--text-muted)]"
      >
        Cancel this booking
      </button>
    )
  }

  return (
    <div role="group" aria-label="Confirm cancellation" className="flex flex-col gap-3">
      <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        Cancelling returns the full amount to the card you paid with. This cannot be undone.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="btn btn-secondary min-h-[44px] disabled:opacity-50"
        >
          {isCancelling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Cancelling</span>
            </>
          ) : (
            "Yes, cancel it"
          )}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isCancelling}
          className="editorial-action min-h-[44px]"
        >
          Keep the booking
        </button>
      </div>
    </div>
  )
}
