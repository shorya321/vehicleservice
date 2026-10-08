/**
 * Business Trip Bookings API
 * Round trip, multi-city and hourly bookings, paid with ONE wallet deduction.
 * SCOPE: Business module ONLY. One-way bookings keep POST /api/business/bookings, untouched.
 */

import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { requireBusinessAuth, apiSuccess, apiError, parseRequestBody } from '@/lib/business/api-utils';
import { businessTripCreationSchema } from '@/lib/business/trips/schemas';
import { getBusinessTripSettings } from '@/lib/business/trips/settings-server';
import { priceBusinessTrip } from '@/lib/business/trips/price-trip-server';
import { activityLogger } from '@/lib/business/activity/log';
import { noticeLowBalance, noticeSpendingLimit } from './wallet-notices';
import { sendTripCreatedEmails } from './trip-emails';

/** Mail goes out inside after(); see ../route.ts for why 60. */
export const maxDuration = 60;

function rejectionReason(message: string): string | null {
  if (message.includes('Insufficient wallet balance')) return 'insufficient_balance';
  if (message.includes('spending limit exceeded')) return 'spending_limit_exceeded';
  if (message.includes('Wallet is frozen')) return 'wallet_frozen';
  if (message.includes('not active')) return 'account_not_active';
  return null;
}

const PUBLIC_REASON: Record<string, string> = {
  insufficient_balance: 'The wallet balance was not enough to cover this booking',
  spending_limit_exceeded: 'A spending limit set on this wallet was reached',
  wallet_frozen: 'The wallet is frozen',
  account_not_active: 'The business account is not active',
};

/**
 * POST /api/business/bookings/trips
 */
export const POST = requireBusinessAuth(async (request: Request, user) => {
  const body = await parseRequestBody(request, businessTripCreationSchema);
  if (!body) return apiError('Invalid request body', 400);

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const settings = await getBusinessTripSettings(supabaseAdmin);
    const priced = await priceBusinessTrip(supabaseAdmin, body, settings, user.businessAccountId);
    if (!priced.ok) return apiError(priced.error, priced.status);
    const { trip } = priced;

    const { data: created, error } = await supabaseAdmin.rpc('create_business_trip_with_wallet_deduction', {
      p_business_id: user.businessAccountId,
      p_created_by_user_id: user.businessId,
      p_trip_type: body.trip_type,
      p_customer_name: body.customer_name,
      p_customer_email: body.customer_email,
      p_customer_phone: body.customer_phone,
      p_vehicle_type_id: body.vehicle_type_id,
      p_passenger_count: body.passenger_count,
      p_adults: body.adults,
      p_children: body.children,
      p_infants: body.infants,
      p_subtotal: trip.quote.subtotal,
      p_discount_percent: trip.quote.discountPercent,
      p_discount_amount: trip.quote.discount,
      p_total_price: trip.quote.total,
      p_legs: trip.legs.map((leg) => ({
        from_location_id: leg.from_location_id,
        to_location_id: leg.to_location_id,
        pickup_address: leg.pickup_address,
        dropoff_address: leg.dropoff_address,
        pickup_datetime: leg.pickup_datetime,
        base_price: leg.base_price,
        discount_amount: leg.discount_amount,
        total_price: leg.total_price,
      })),
      p_customer_notes: body.customer_notes || undefined,
      p_reference_number: body.reference_number || undefined,
      p_hourly_package: trip.hourly?.package,
      p_duration_hours: trip.hourly?.hours,
      p_included_km: trip.hourly?.includedKm,
      p_extra_hour_price: trip.hourly?.extraHourPrice,
      p_price_signature: body.price_signature,
      p_price_signature_timestamp: body.price_signature_timestamp,
      p_price_signature_nonce: body.price_signature_nonce,
    });

    if (error) {
      console.error('Business trip creation error:', error);
      const reason = rejectionReason(error.message);
      if (reason) {
        await activityLogger(user, request)('wallet.payment_rejected', {
          amount: trip.quote.total,
          currency: 'AED',
          metadata: {
            reason_code: reason,
            reason_public: PUBLIC_REASON[reason],
            attempted_by_label: user.memberName ?? user.memberEmail ?? 'A team member',
          },
        });
      }
      if (reason === 'insufficient_balance') return apiError('Insufficient wallet balance. Please add credits.', 402);
      if (reason === 'account_not_active') return apiError('Business account is not active. Contact support.', 403);
      if (reason === 'wallet_frozen') return apiError('Your wallet is frozen. Contact support.', 403);
      if (error.message.includes('price_signature_nonce')) {
        return apiError('This booking quote has already been used. Please get a new quote.', 409);
      }
      if (reason === 'spending_limit_exceeded') {
        const isDaily = error.message.includes('Daily');
        void noticeSpendingLimit(supabaseAdmin, user.businessAccountId, isDaily, trip.quote.total);
        return apiError(`${isDaily ? 'Daily' : 'Monthly'} spending limit exceeded. Contact administrator.`, 402);
      }
      return apiError('Failed to create booking', 500);
    }

    const result = (created ?? {}) as { group_id?: string | null; group_number?: string | null; booking_ids?: string[] };
    const bookingIds = result.booking_ids ?? [];
    if (bookingIds.length === 0) return apiError('Failed to create booking', 500);

    // Add-ons ride every journey: the same passengers, the same child seats.
    if (trip.addons.length > 0) {
      const records = bookingIds.flatMap((bookingId) =>
        trip.addons.map((addon) => ({
          business_booking_id: bookingId,
          addon_id: addon.addon_id,
          quantity: addon.quantity,
          unit_price: addon.unit_price,
          total_price: addon.total_price,
          child_ages: addon.child_ages,
        }))
      );
      const { error: addonsError } = await supabaseAdmin.from('business_booking_addons').insert(records);
      if (addonsError) {
        const hasChildSeat = trip.addons.some((a) => a.child_ages !== null);
        console.error(
          hasChildSeat
            ? 'OPS ALERT: trip created and wallet charged, but child-seat addons failed to save'
            : 'Failed to save trip addons:',
          { bookingIds, businessAccountId: user.businessAccountId, error: addonsError }
        );
        if (hasChildSeat) {
          const reference = result.group_number ?? bookingIds[0];
          return apiError(
            `Your booking was created and charged (reference ${reference}), but the child seat could ` +
              'not be recorded. Do not rebook. Contact support with this reference so the seat is added.',
            500
          );
        }
      }
    }

    const { data: rows } = await supabaseAdmin
      .from('business_bookings')
      .select('id, booking_number, trip_number, leg_index')
      .in('id', bookingIds)
      .order('leg_index', { ascending: true, nullsFirst: true });
    const first = rows?.[0];

    after(async () => {
      await sendTripCreatedEmails({ supabase: supabaseAdmin, user, body, trip, bookingIds, groupNumber: result.group_number ?? null });
    });

    await noticeLowBalance(supabaseAdmin, user.businessAccountId);

    return apiSuccess(
      {
        id: bookingIds[0],
        booking_ids: bookingIds,
        booking_number: first?.booking_number,
        trip_number: first?.trip_number,
        group_number: result.group_number ?? null,
        message: 'Booking created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Business trip API error:', error);
    return apiError('Failed to create booking', 500);
  }
});
