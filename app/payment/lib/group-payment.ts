import 'server-only'
import { format } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGroupSignature } from '@/lib/security/booking-hmac'
import { toBookingTz } from '@/lib/utils/timezone'
import { legLabel } from '@/lib/trips/display'
import type { LedgerLeg } from '@/components/checkout/booking-ledger'

export interface GroupForPayment {
  id: string
  groupNumber: string
  tripType: string
  total: number
  subtotal: number
  discount: number
  discountPercent: number
  amenitiesTotal: number
  paymentStatus: string
  vehicleName: string | null
  seats: number | null
  luggage: number | null
  passengerCount: number
  primaryName: string | null
  primaryPhone: string | null
  ledgerLegs: LedgerLeg[]
}

/** A customer's own round trip or multi-city trip, with its journeys, for the payment page. */
export async function getGroupForPayment(groupNumber: string, userId: string): Promise<GroupForPayment | null> {
  const adminClient = createAdminClient()

  const { data: group } = await adminClient
    .from('booking_groups')
    .select('id, group_number, trip_type, total_price, subtotal, discount_amount, discount_percent, payment_status, vehicle_type:vehicle_types(name, passenger_capacity, luggage_capacity)')
    .eq('group_number', groupNumber)
    .eq('customer_id', userId)
    .maybeSingle()
  if (!group) return null

  const { data: legs } = await adminClient
    .from('bookings')
    .select('id, trip_type, leg_index, pickup_address, dropoff_address, pickup_datetime, base_price, discount_amount, amenities_price, passenger_count, booking_passengers(first_name, last_name, phone, is_primary)')
    .eq('booking_group_id', group.id)
    .order('leg_index', { ascending: true })
  if (!legs || legs.length === 0) return null

  const primary = legs[0].booking_passengers?.find((p) => p.is_primary) ?? legs[0].booking_passengers?.[0]
  const vehicle = group.vehicle_type as unknown as { name: string; passenger_capacity: number | null; luggage_capacity: number | null } | null

  return {
    id: group.id,
    groupNumber: group.group_number,
    tripType: group.trip_type,
    total: Number(group.total_price),
    subtotal: Number(group.subtotal),
    discount: Number(group.discount_amount),
    discountPercent: Number(group.discount_percent),
    amenitiesTotal: legs.reduce((sum, leg) => sum + Number(leg.amenities_price ?? 0), 0),
    paymentStatus: group.payment_status,
    vehicleName: vehicle?.name ?? null,
    seats: vehicle?.passenger_capacity ?? null,
    luggage: vehicle?.luggage_capacity ?? null,
    passengerCount: legs[0].passenger_count,
    primaryName: primary ? `${primary.first_name} ${primary.last_name}` : null,
    primaryPhone: primary?.phone ?? null,
    ledgerLegs: legs.map((leg) => ({
      key: leg.id,
      label: legLabel(leg, legs.length) ?? 'Journey',
      originName: leg.pickup_address,
      destinationName: leg.dropoff_address,
      dateLabel: format(toBookingTz(leg.pickup_datetime), 'EEE, MMM d'),
      timeLabel: format(toBookingTz(leg.pickup_datetime), 'HH:mm'),
      fare: Number(leg.base_price),
    })),
  }
}

/**
 * The group's PaymentIntent, reused while it is still payable, created otherwise. The group
 * signature is checked before any new intent is created, as for a single booking.
 */
export async function getOrCreateGroupPaymentIntent(
  group: GroupForPayment,
  userId: string,
  userEmail: string
): Promise<{ clientSecret: string | null }> {
  const { createGroupPaymentIntent, createOrRetrieveStripeCustomer, retrievePaymentIntent } = await import('@/lib/stripe/server')
  const adminClient = createAdminClient()

  const { data: record } = await adminClient
    .from('booking_groups')
    .select('stripe_payment_intent_id, total_price, customer_id, vehicle_type_id, leg_count, price_signature, price_signature_timestamp, price_signature_nonce')
    .eq('id', group.id)
    .eq('customer_id', userId)
    .single()
  if (!record) throw new Error('Booking not found')

  if (record.stripe_payment_intent_id) {
    try {
      const existing = await retrievePaymentIntent(record.stripe_payment_intent_id)
      if (existing.status !== 'canceled') return { clientSecret: existing.client_secret }
    } catch {
      // Fall through to a new intent.
    }
  }

  if (!record.price_signature || !record.price_signature_timestamp || !record.price_signature_nonce) {
    throw new Error('Booking integrity verification failed')
  }
  const hmac = verifyGroupSignature({
    groupId: group.id,
    totalPrice: Number(record.total_price),
    customerId: record.customer_id ?? userId,
    vehicleTypeId: record.vehicle_type_id,
    legCount: record.leg_count,
    signature: record.price_signature,
    timestamp: Number(record.price_signature_timestamp),
    nonce: record.price_signature_nonce,
  })
  if (!hmac.valid) {
    console.error('SECURITY ALERT: group HMAC verification failed on the payment page', { groupId: group.id, reason: hmac.reason })
    throw new Error('Booking integrity verification failed')
  }

  const stripeCustomerId = await createOrRetrieveStripeCustomer(userId, userEmail, group.primaryName ?? undefined, group.primaryPhone ?? undefined)
  const intent = await createGroupPaymentIntent(Number(record.total_price), group.id, stripeCustomerId, userEmail)

  await adminClient
    .from('booking_groups')
    .update({ stripe_payment_intent_id: intent.id })
    .eq('id', group.id)

  return { clientSecret: intent.client_secret }
}
