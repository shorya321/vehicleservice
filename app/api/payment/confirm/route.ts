import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { finalizeBookingPayment } from '@/lib/payment/finalize-booking'
import { CURRENCY_COOKIE_NAME, DEFAULT_CURRENCY_CODE } from '@/lib/currency/types'
import { getEnabledCurrencies } from '@/lib/currency/server'
import { resolveCurrentCurrency } from '@/lib/currency/resolve'
import { finalizeGroupPayment } from '@/lib/payment/finalize-group'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasGuestAccess } from '@/lib/security/guest-access'

/**
 * A guest may confirm only a booking or trip that has no account and that this browser
 * created (guest cookie, keyed by its reference). Returns the guest email for the
 * receipt fallback, or null when the caller has no such access.
 */
async function guestEmailIfAllowed(bookingId?: string, groupId?: string): Promise<string | null> {
  const adminClient = createAdminClient()
  let owner: { reference: string; customerId: string | null; guestEmail: string | null } | null = null

  if (groupId) {
    const { data } = await adminClient
      .from('booking_groups')
      .select('group_number, customer_id, guest_email')
      .eq('id', groupId)
      .maybeSingle()
    if (data) owner = { reference: data.group_number, customerId: data.customer_id, guestEmail: data.guest_email }
  } else if (bookingId) {
    const { data } = await adminClient
      .from('bookings')
      .select('booking_number, customer_id, guest_email')
      .eq('id', bookingId)
      .maybeSingle()
    if (data) owner = { reference: data.booking_number, customerId: data.customer_id, guestEmail: data.guest_email }
  }

  if (!owner || owner.customerId !== null || !owner.guestEmail) return null
  return (await hasGuestAccess(owner.reference)) ? owner.guestEmail : null
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get request body
    const { paymentIntentId, bookingId, groupId } = await request.json()

    if (!paymentIntentId || (!bookingId && !groupId)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // A guest booking this browser created is confirmed as a guest, whether or not the
    // visitor has signed in since. Otherwise: scoped to the signed-in customer, as before.
    // The finalizers re-check the signature, intent and amount either way.
    const guestEmail = await guestEmailIfAllowed(bookingId, groupId)
    if (!user && !guestEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    const expectedCustomerId = guestEmail ? undefined : user?.id
    const userEmail = guestEmail ?? user?.email ?? undefined

    // Determine user's selected currency from cookie (email display only)
    const userCurrency = resolveCurrentCurrency(
      request.cookies.get(CURRENCY_COOKIE_NAME)?.value,
      await getEnabledCurrencies(),
      DEFAULT_CURRENCY_CODE
    )

    // Delegate to the shared, idempotent finalizers (also used by the webhook backstop).
    // A round trip or multi-city trip is paid as its group.
    const result = groupId
      ? await finalizeGroupPayment({
          paymentIntentId,
          groupId,
          expectedCustomerId,
          userCurrency,
          userEmail,
        })
      : await finalizeBookingPayment({
          paymentIntentId,
          bookingId,
          expectedCustomerId,
          userCurrency,
          userEmail,
        })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
