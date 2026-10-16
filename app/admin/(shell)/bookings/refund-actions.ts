'use server'

/**
 * Admin refund of a cancelled business booking to its wallet.
 *
 * Deliberately not one click: the dialog shows what was paid and already refunded, asks for an
 * amount and a reason, and the admin must type the booking number. The database function
 * refund_business_booking enforces the money rules again under a row lock, so a double submit or
 * a second admin can never refund more than the booking's wallet charge.
 *
 * A 'use server' file may only export async functions, so result shapes are not exported.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminAction } from '@/lib/auth/admin-action'
import {
  businessRefundRequestSchema,
  refundBlockedReason,
  refundConfirmationMatches,
  refundableAmount,
} from '@/lib/business/refunds'

interface RefundSummary {
  bookingNumber: string
  bookingStatus: string
  paid: number
  alreadyRefunded: number
  refundable: number
}

async function loadRefundSummary(bookingId: string): Promise<RefundSummary | null> {
  const admin = createAdminClient()
  const { data: booking, error } = await admin
    .from('business_bookings')
    .select('booking_number, booking_status, wallet_deduction_amount, business_account_id')
    .eq('id', bookingId)
    .maybeSingle()
  if (error || !booking) return null

  const { data: refunds, error: refundsError } = await admin
    .from('wallet_transactions')
    .select('amount')
    .eq('reference_id', bookingId)
    .eq('business_account_id', booking.business_account_id)
    .eq('transaction_type', 'refund')
  if (refundsError) return null

  const paid = Number(booking.wallet_deduction_amount ?? 0)
  const alreadyRefunded = (refunds ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
  return {
    bookingNumber: booking.booking_number,
    bookingStatus: booking.booking_status ?? '',
    paid,
    alreadyRefunded,
    refundable: refundableAmount(paid, alreadyRefunded),
  }
}

/** What the dialog shows: paid, already refunded, refundable. Read fresh every time it opens. */
export async function getBusinessRefundSummary(
  bookingId: string
): Promise<{ summary?: RefundSummary; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { error: auth.error }

  const summary = await loadRefundSummary(bookingId)
  return summary ? { summary } : { error: 'Could not load this booking.' }
}

/** The database raises plain-English messages; pass the known ones through, hide the rest. */
function friendlyRefundError(message: string): string {
  const known = [
    'Only a cancelled booking can be refunded',
    'This booking has already been refunded in full',
    'Refund exceeds the refundable amount',
    'A refund reason of at least 10 characters is required',
    'Refund amount must be above zero',
  ]
  const hit = known.find((k) => message.includes(k))
  if (!hit) return 'The refund could not be completed. No money has moved.'
  return message.slice(message.indexOf(hit)).split('\n')[0]
}

export async function refundBusinessBooking(input: unknown): Promise<{
  success?: boolean
  refunded?: number
  refundableAfter?: number
  newBalance?: number
  error?: string
}> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { error: auth.error }

  const parsed = businessRefundRequestSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid refund' }
  const { bookingId, amount, reason, confirmation } = parsed.data

  try {
    const summary = await loadRefundSummary(bookingId)
    if (!summary) return { error: 'Could not load this booking.' }

    if (!refundConfirmationMatches(confirmation, summary.bookingNumber)) {
      return { error: `Type ${summary.bookingNumber} exactly to confirm the refund.` }
    }

    const blocked = refundBlockedReason({
      bookingStatus: summary.bookingStatus,
      paid: summary.paid,
      alreadyRefunded: summary.alreadyRefunded,
      amount,
    })
    if (blocked) return { error: blocked }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await createAdminClient().rpc('refund_business_booking', {
      p_booking_id: bookingId,
      p_amount: amount,
      p_reason: reason,
      p_admin_email: user?.email ?? auth.userId,
    })

    if (error) {
      console.error('Business booking refund failed:', { bookingId, error })
      return { error: friendlyRefundError(error.message) }
    }

    const row = data?.[0]
    revalidatePath('/admin/bookings')
    revalidatePath(`/admin/bookings/${bookingId}`)
    return {
      success: true,
      refunded: Number(row?.refunded_amount ?? amount),
      refundableAfter: Number(row?.refundable_after ?? 0),
      newBalance: Number(row?.new_balance ?? 0),
    }
  } catch (error) {
    console.error('Business booking refund failed:', { bookingId, error })
    return { error: 'The refund could not be completed. No money has moved.' }
  }
}
