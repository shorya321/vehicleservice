/**
 * Confirms a Payment Element or saved-card top-up actually reached the wallet.
 *
 * Stripe has taken the money by the time this runs, but the credit lands from the
 * webhook, which can be late or misconfigured. This polls verify-intent, which reports
 * the webhook's credit or, after a grace period, credits the wallet itself. A plain
 * async function rather than a hook, so it keeps running after the modal closes.
 *
 * SCOPE: Business module ONLY
 */

import { toast } from 'sonner'

// ~30s in all: past verify-intent's 20s grace period, with room for one slow call.
const POLL_INTERVAL_MS = 2500
const MAX_ATTEMPTS = 13

interface VerifyIntentResponse {
  data?: { credited?: boolean; pending?: boolean }
  error?: string
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

async function isCredited(paymentIntentId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/business/wallet/verify-intent?payment_intent_id=${encodeURIComponent(paymentIntentId)}`,
      { cache: 'no-store' }
    )
    if (!response.ok) return false
    const result: VerifyIntentResponse = await response.json()
    return result.data?.credited === true
  } catch (error) {
    console.error('Wallet credit check failed:', error)
    return false
  }
}

/**
 * @param onSettled runs once, credited or not, so the caller can refresh the balance
 */
export async function confirmWalletCredit(
  paymentIntentId: string,
  onSettled: () => void
): Promise<void> {
  const toastId = toast.loading('Payment received. Updating your wallet.')

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(POLL_INTERVAL_MS)
    if (await isCredited(paymentIntentId)) {
      toast.success('Payment successful. Your wallet has been recharged.', { id: toastId })
      onSettled()
      return
    }
  }

  toast.success('Payment received. Your wallet will update shortly.', { id: toastId })
  onSettled()
}
