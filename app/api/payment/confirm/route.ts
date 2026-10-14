import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { finalizeBookingPayment } from '@/lib/payment/finalize-booking'
import { CURRENCY_COOKIE_NAME, DEFAULT_CURRENCY_CODE } from '@/lib/currency/types'
import { getEnabledCurrencies } from '@/lib/currency/server'
import { resolveCurrentCurrency } from '@/lib/currency/resolve'
import { finalizeGroupPayment } from '@/lib/payment/finalize-group'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get request body
    const { paymentIntentId, bookingId, groupId } = await request.json()

    if (!paymentIntentId || (!bookingId && !groupId)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

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
          expectedCustomerId: user.id,
          userCurrency,
          userEmail: user.email,
        })
      : await finalizeBookingPayment({
          paymentIntentId,
          bookingId,
          expectedCustomerId: user.id,
          userCurrency,
          userEmail: user.email,
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
