/**
 * Convert ONE quotation trip into a real booking.
 *
 * Idempotency without touching lib/security/booking-hmac.ts:
 *
 * create_booking_with_wallet_deduction does not VERIFY the price signature — it only stores
 * it (verification lives in the booking API route, which is guarding against a tampering
 * *client*; here the server computed the price itself one line earlier). And
 * business_bookings.price_signature_nonce carries a partial UNIQUE index.
 *
 * So we pass the trip's own stable conversion_nonce. A second attempt violates that index,
 * and because deduct_from_wallet runs BEFORE the INSERT inside the same plpgsql transaction
 * and re-raises on error, the wallet debit rolls back with it. We then recover by looking the
 * existing booking up by nonce. That closes the window where a request dies after the RPC
 * commits but before converted_booking_id is stamped — which would otherwise double-charge.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation';
import { roundAed } from './pricing';
import { UNIQUE_VIOLATION, type ConvertibleItem, type ConvertibleQuotation } from './convert';
import type { QuotationConversionLineResult } from './types';

interface ConvertItemArgs {
  /** Service-role client: the RPC is SECURITY DEFINER and the writes bypass RLS. */
  admin: SupabaseClient;
  quotation: ConvertibleQuotation;
  item: ConvertibleItem;
  createdByUserId: string | null;
}

export async function convertQuotationItem({
  admin,
  quotation,
  item,
  createdByUserId,
}: ConvertItemArgs): Promise<QuotationConversionLineResult> {
  if (item.converted_booking_id) {
    return { itemId: item.id, status: 'already_converted', bookingId: item.converted_booking_id };
  }

  if (!item.pickup_datetime) {
    return { itemId: item.id, status: 'failed', error: 'Trip has no pickup date' };
  }

  // Re-priced here as well as in preflight: preflight is a dry run and the world may have
  // moved. The wallet is charged from THIS number, never the stored estimate.
  const priced = await calculateBusinessBookingPrice(admin, {
    fromLocationId: item.from_location_id,
    toLocationId: item.to_location_id,
    vehicleTypeId: item.vehicle_type_id,
    passengerCount: item.passenger_count,
    selectedAddons: item.addons,
  });

  if ('error' in priced) {
    return { itemId: item.id, status: 'failed', error: priced.error };
  }

  const basePrice = roundAed(priced.basePrice);
  const totalPrice = roundAed(priced.totalPrice);

  const { data: bookingId, error } = await admin.rpc('create_booking_with_wallet_deduction', {
    p_business_id: quotation.business_account_id,
    p_created_by_user_id: createdByUserId,
    p_customer_name: quotation.customer_name,
    p_customer_email: quotation.customer_email,
    p_customer_phone: quotation.customer_phone,
    p_from_location_id: item.from_location_id,
    p_to_location_id: item.to_location_id,
    p_pickup_address: item.pickup_address,
    p_dropoff_address: item.dropoff_address,
    p_pickup_datetime: item.pickup_datetime,
    p_vehicle_type_id: item.vehicle_type_id,
    p_passenger_count: item.passenger_count,
    p_base_price: basePrice,
    p_total_price: totalPrice,
    p_customer_notes: `Converted from quotation ${quotation.quotation_number}`,
    p_reference_number: quotation.quotation_number,
    // Not a real HMAC: the server computed this price itself, so there is nothing to
    // authenticate. The nonce is what matters — it is the idempotency key.
    p_price_signature: `quotation:${item.id}`,
    p_price_signature_timestamp: Date.now(),
    p_price_signature_nonce: item.conversion_nonce,
    p_adults: item.adults,
    p_children: item.children,
    p_infants: item.infants,
  });

  if (error) {
    // The idempotency path: this trip was already converted by an attempt that died before
    // it could stamp the row. Recover the existing booking instead of charging again.
    if (error.code === UNIQUE_VIOLATION) {
      const recovered = await recoverByNonce(admin, item.conversion_nonce);
      if (recovered) {
        await stampConverted(admin, item.id, recovered.id, recovered.booking_number);
        return {
          itemId: item.id,
          status: 'already_converted',
          bookingId: recovered.id,
          bookingNumber: recovered.booking_number,
        };
      }
    }

    console.error('Quotation item conversion failed:', error);
    await admin
      .from('business_quotation_items')
      .update({ conversion_error: error.message.slice(0, 500) })
      .eq('id', item.id);

    return { itemId: item.id, status: 'failed', error: friendlyError(error.message) };
  }

  const { data: booking } = await admin
    .from('business_bookings')
    .select('booking_number')
    .eq('id', bookingId)
    .single();

  const bookingNumber = booking?.booking_number ?? null;

  // Addons mirror the booking API's own post-create step. Non-fatal: the booking exists and
  // the wallet is charged, so failing the whole conversion over a missing extra would be worse.
  if (priced.verifiedAddons.length > 0) {
    const { error: addonError } = await admin.from('business_booking_addons').insert(
      priced.verifiedAddons.map((addon) => ({
        business_booking_id: bookingId,
        addon_id: addon.addon_id,
        quantity: addon.quantity,
        unit_price: addon.unit_price,
        total_price: addon.total_price,
      }))
    );
    if (addonError) console.error('Failed to attach addons to converted booking:', addonError);
  }

  await stampConverted(admin, item.id, bookingId as string, bookingNumber);

  return {
    itemId: item.id,
    status: 'converted',
    bookingId: bookingId as string,
    bookingNumber: bookingNumber ?? undefined,
  };
}

async function recoverByNonce(admin: SupabaseClient, nonce: string) {
  const { data } = await admin
    .from('business_bookings')
    .select('id, booking_number')
    .eq('price_signature_nonce', nonce)
    .maybeSingle();
  return data;
}

/**
 * bqi_conversion_stamp requires converted_booking_id and converted_at to be set together, so
 * they are always written in one update.
 */
async function stampConverted(
  admin: SupabaseClient,
  itemId: string,
  bookingId: string,
  bookingNumber: string | null
) {
  const { error } = await admin
    .from('business_quotation_items')
    .update({
      converted_booking_id: bookingId,
      converted_booking_number: bookingNumber,
      converted_at: new Date().toISOString(),
      conversion_error: null,
    })
    .eq('id', itemId);

  // Survivable: the nonce means a retry finds the booking again rather than creating a second.
  if (error) console.error('Failed to stamp converted quotation item:', error);
}

/** deduct_from_wallet raises prose exceptions; surface the useful ones verbatim. */
function friendlyError(message: string): string {
  if (message.includes('Insufficient wallet balance')) return 'Insufficient wallet balance';
  if (message.includes('frozen')) return 'Your wallet is frozen';
  if (message.includes('limit')) return message.replace(/^.*?ERROR:\s*/, '');
  return 'Could not create this booking';
}
