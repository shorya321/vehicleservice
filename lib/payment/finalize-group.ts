/**
 * Finalizer for a round trip or multi-city trip, paid as one PaymentIntent.
 *
 * Same guarantees as `finalize-booking.ts`, for the group:
 *  - HMAC re-verification of the group total (skipTtl).
 *  - Stripe's charged amount must equal the group total, and the journeys must
 *    add up to it to the cent.
 *  - Exactly once: the group is claimed with a conditional update, so the
 *    confirm route and the webhook racing each other send one set of emails.
 */

import { retrievePaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGroupSignature, verifyPaymentAmount } from '@/lib/security/booking-hmac'
import { toCents } from '@/lib/trips/pricing'
import { sendBookingEmails, type FinalizeBookingResult } from './finalize-booking'

export interface FinalizeGroupParams {
  paymentIntentId: string
  groupId: string
  /** Set on the authenticated confirm path; the webhook omits it. */
  expectedCustomerId?: string
  userCurrency?: string
  userEmail?: string
}

export async function finalizeGroupPayment(params: FinalizeGroupParams): Promise<FinalizeBookingResult> {
  const { paymentIntentId, groupId, expectedCustomerId, userCurrency = 'AED', userEmail } = params
  const adminClient = createAdminClient()

  let groupQuery = adminClient.from('booking_groups').select('*').eq('id', groupId)
  if (expectedCustomerId) groupQuery = groupQuery.eq('customer_id', expectedCustomerId)
  const { data: group, error: groupError } = await groupQuery.single()

  if (groupError || !group) {
    return { ok: false, status: 404, error: 'Booking not found' }
  }

  if (group.payment_status === 'completed') {
    return { ok: true, status: 200, booking: group, alreadyCompleted: true }
  }

  if (!group.price_signature || !group.price_signature_timestamp || !group.price_signature_nonce || !group.customer_id) {
    console.error('SECURITY ALERT: unsigned booking group at payment finalization', { groupId })
    return { ok: false, status: 403, error: 'Booking integrity verification failed' }
  }

  const hmac = verifyGroupSignature(
    {
      groupId: group.id,
      totalPrice: Number(group.total_price),
      customerId: group.customer_id,
      vehicleTypeId: group.vehicle_type_id,
      legCount: group.leg_count,
      signature: group.price_signature,
      timestamp: Number(group.price_signature_timestamp),
      nonce: group.price_signature_nonce,
    },
    { skipTtl: true }
  )
  if (!hmac.valid) {
    console.error('SECURITY ALERT: group HMAC re-verification failed', { groupId, reason: hmac.reason })
    return { ok: false, status: 403, error: 'Booking integrity verification failed' }
  }

  const paymentIntent = await retrievePaymentIntent(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return { ok: false, status: 400, error: 'Payment not completed' }
  }
  if (paymentIntent.metadata?.groupId !== groupId) {
    console.error('SECURITY ALERT: PaymentIntent does not belong to this group', { groupId, paymentIntentId })
    return { ok: false, status: 403, error: 'Payment amount verification failed' }
  }

  const amountCheck = verifyPaymentAmount(paymentIntent.amount, Number(group.total_price))
  if (!amountCheck.valid) {
    console.error('SECURITY ALERT: group payment amount mismatch', { groupId, reason: amountCheck.reason })
    return { ok: false, status: 403, error: 'Payment amount verification failed' }
  }

  const { data: legs, error: legsError } = await adminClient
    .from('bookings')
    .select('*')
    .eq('booking_group_id', groupId)
    .order('leg_index', { ascending: true })

  if (legsError || !legs || legs.length !== group.leg_count) {
    console.error('Group finalization: journeys missing', { groupId, error: legsError })
    return { ok: false, status: 500, error: 'Failed to update booking status' }
  }

  const legCents = legs.reduce((sum, leg) => sum + toCents(Number(leg.total_price)), 0)
  if (legCents !== toCents(Number(group.total_price))) {
    console.error('SECURITY ALERT: journeys do not add up to the group total', { groupId, legCents })
    return { ok: false, status: 403, error: 'Payment amount verification failed' }
  }

  const now = new Date().toISOString()
  const paymentFields = {
    payment_status: 'completed',
    booking_status: 'confirmed',
    stripe_charge_id: paymentIntent.latest_charge as string,
    paid_at: now,
    payment_method_details: {
      type: paymentIntent.payment_method_types[0],
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    },
    updated_at: now,
  }

  // The claim. Whoever flips processing to completed sends the emails; the loser returns quietly.
  const { data: claimed, error: claimError } = await adminClient
    .from('booking_groups')
    .update({ ...paymentFields, stripe_payment_intent_id: paymentIntent.id })
    .eq('id', groupId)
    .neq('payment_status', 'completed')
    .select('*')

  if (claimError) {
    console.error('Group finalization: claim failed', claimError)
    return { ok: false, status: 500, error: 'Failed to update booking status' }
  }
  if (!claimed || claimed.length === 0) {
    return { ok: true, status: 200, booking: group, alreadyCompleted: true }
  }

  const { data: updatedLegs, error: updateError } = await adminClient
    .from('bookings')
    .update(paymentFields)
    .eq('booking_group_id', groupId)
    .select('*')

  if (updateError || !updatedLegs) {
    console.error('Group finalization: journeys not updated', updateError)
    return { ok: false, status: 500, error: 'Failed to update booking status' }
  }

  const ordered = [...updatedLegs].sort((a, b) => (a.leg_index ?? 0) - (b.leg_index ?? 0))
  await sendBookingEmails(adminClient, ordered[0], userCurrency, userEmail, {
    groupNumber: group.group_number,
    tripType: group.trip_type === 'multi_city' ? 'multi_city' : 'round_trip',
    legs: ordered,
    subtotal: Number(group.subtotal),
    discount: Number(group.discount_amount),
    total: Number(group.total_price),
  })

  return { ok: true, status: 200, booking: claimed[0] }
}
