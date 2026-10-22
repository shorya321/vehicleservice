import 'server-only';

/**
 * Convert ONE round trip, multi-city or hourly quotation trip into real bookings.
 *
 * The booking side does the work: priceServerSideBusinessTrip re-prices the trip with every rule
 * the wizard applies (admin switches, journey timing and buffer, hourly notice, add-ons per
 * journey), and create_business_trip_with_wallet_deduction writes the group and its journeys
 * with ONE wallet debit. A converted trip is indistinguishable from one booked in the wizard.
 *
 * Idempotency works as it does for one way (see convert-item.ts): the trip's conversion_nonce
 * is the price_signature_nonce, UNIQUE on business_booking_groups and on business_bookings, so a
 * retry fails at the database with the debit rolled back, and the existing bookings are found
 * again by nonce.
 *
 * SCOPE: Business module ONLY
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { bookingUtcToLocalInput } from '@/lib/business/utils/timezone';
import {
  priceServerSideBusinessTrip,
  type PricedBusinessTrip,
  type PriceTripResult,
} from '@/lib/business/trips/price-trip-server';
import { isBusinessHourlyPackage } from '@/lib/business/trips/types';
import type { BusinessTripCreationInput } from '@/lib/business/trips/schemas';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import { UNIQUE_VIOLATION, type ConvertibleItem, type ConvertibleQuotation } from './convert';
import { isLineConverted } from './status';
import { friendlyError } from './convert-item';
import type { QuotationConversionLineResult } from './types';

type Admin = SupabaseClient<Database>;

/** True for a trip that converts through this module rather than convertQuotationItem. */
export function isTripConversion(item: Pick<ConvertibleItem, 'trip_type'>): boolean {
  return item.trip_type === 'round_trip' || item.trip_type === 'multi_city' || item.trip_type === 'hourly';
}

function dateTime(iso: string | null): { date: string; time: string } {
  const [date = '', time = ''] = (iso ? bookingUtcToLocalInput(iso) : '').split('T');
  return { date, time };
}

/**
 * The trip as the booking wizard would have submitted it. The signature fields are placeholders:
 * the server-side pricer never reads them.
 */
export function tripBodyFor(
  quotation: ConvertibleQuotation,
  item: ConvertibleItem,
  vehicleTypeId: string = item.vehicle_type_id
): BusinessTripCreationInput | null {
  const shared = {
    customer_name: quotation.customer_name,
    customer_email: quotation.customer_email ?? '',
    customer_phone: quotation.customer_phone ?? '',
    vehicle_type_id: vehicleTypeId,
    passenger_count: item.passenger_count,
    adults: item.adults,
    children: item.children,
    infants: item.infants,
    selected_addons: item.addons.map((a) => ({
      addon_id: a.addon_id,
      quantity: a.quantity,
      child_ages: a.child_ages ?? undefined,
    })),
    base_price: 0,
    price_signature: `quotation:${item.id}`,
    price_signature_timestamp: Date.now(),
    price_signature_nonce: item.conversion_nonce,
  };

  if (item.trip_type === 'hourly') {
    if (!isBusinessHourlyPackage(item.hourly_package)) return null;
    return {
      ...shared,
      trip_type: 'hourly',
      hourly: {
        from_location_id: item.from_location_id,
        pickup_address: item.pickup_address,
        hourly_package: item.hourly_package,
        ...dateTime(item.pickup_datetime),
      },
    };
  }

  const legs = (item.legs ?? []).map((leg) => ({
    from_location_id: leg.from_location_id,
    to_location_id: leg.to_location_id,
    pickup_address: leg.pickup_address,
    dropoff_address: leg.dropoff_address,
    ...dateTime(leg.pickup_datetime),
  }));
  if (item.trip_type === 'round_trip') return { ...shared, trip_type: 'round_trip', legs };
  if (item.trip_type === 'multi_city') return { ...shared, trip_type: 'multi_city', legs };
  return null;
}

/** Fresh price for the whole trip, as the booking wizard would charge it now. */
export async function priceQuotationTrip(
  admin: Admin,
  quotation: ConvertibleQuotation,
  item: ConvertibleItem,
  settings: BusinessTripSettings,
  vehicleTypeId: string = item.vehicle_type_id
): Promise<PriceTripResult> {
  const body = tripBodyFor(quotation, item, vehicleTypeId);
  if (!body) return { ok: false, status: 400, error: 'This trip is missing its journeys or package' };
  if (body.trip_type !== 'hourly' && body.legs.some((leg) => !leg.date || !leg.time)) {
    return { ok: false, status: 400, error: 'Every journey needs a date and time' };
  }
  return priceServerSideBusinessTrip(admin, body, settings, null);
}

/**
 * A converted trip, with what the wizard's trip email needs, so the passenger and the business
 * get the same single confirmation per trip a wizard booking sends.
 */
export interface ConvertedTripLine extends QuotationConversionLineResult {
  email?: {
    body: BusinessTripCreationInput;
    trip: PricedBusinessTrip;
    bookingIds: string[];
    groupNumber: string | null;
  };
}

interface ConvertTripArgs {
  admin: Admin;
  quotation: ConvertibleQuotation;
  item: ConvertibleItem;
  createdByUserId: string;
  settings: BusinessTripSettings;
}

export async function convertQuotationTrip({
  admin,
  quotation,
  item,
  createdByUserId,
  settings,
}: ConvertTripArgs): Promise<ConvertedTripLine> {
  if (isLineConverted(item)) {
    return {
      itemId: item.id,
      status: 'already_converted',
      bookingId: item.converted_booking_id ?? undefined,
    };
  }

  // A run that died after the RPC committed but before the stamp: find the trip again first, so a
  // retry never re-prices (and possibly refuses) a trip that is already booked and paid.
  const existing = await recoverTripByNonce(admin, item.conversion_nonce);
  if (existing) {
    await stampTripConverted(admin, item.id, existing);
    return {
      itemId: item.id,
      status: 'already_converted',
      bookingId: existing.bookingId,
      bookingNumber: existing.bookingNumber ?? undefined,
    };
  }

  // Re-priced here as well as in preflight. The wallet is charged from THIS number.
  const priced = await priceQuotationTrip(admin, quotation, item, settings);
  if (!priced.ok) return { itemId: item.id, status: 'failed', error: priced.error };
  const { trip } = priced;
  const tripType = item.trip_type as 'round_trip' | 'multi_city' | 'hourly';

  const { data: created, error } = await admin.rpc('create_business_trip_with_wallet_deduction', {
    p_business_id: quotation.business_account_id,
    p_created_by_user_id: createdByUserId,
    p_trip_type: tripType,
    p_customer_name: quotation.customer_name,
    p_customer_email: quotation.customer_email ?? '',
    p_customer_phone: quotation.customer_phone ?? '',
    p_vehicle_type_id: item.vehicle_type_id,
    p_passenger_count: item.passenger_count,
    p_adults: item.adults,
    p_children: item.children,
    p_infants: item.infants,
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
    p_customer_notes: `Converted from quotation ${quotation.quotation_number}`,
    p_reference_number: quotation.quotation_number,
    p_hourly_package: trip.hourly?.package,
    p_duration_hours: trip.hourly?.hours,
    p_included_km: trip.hourly?.includedKm,
    p_extra_hour_price: trip.hourly?.extraHourPrice,
    // Not a real HMAC, as for one way: the server priced this itself. The nonce is the key.
    p_price_signature: `quotation:${item.id}`,
    p_price_signature_timestamp: Date.now(),
    p_price_signature_nonce: item.conversion_nonce,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const recovered = await recoverTripByNonce(admin, item.conversion_nonce);
      if (recovered) {
        await stampTripConverted(admin, item.id, recovered);
        return {
          itemId: item.id,
          status: 'already_converted',
          bookingId: recovered.bookingId,
          bookingNumber: recovered.bookingNumber ?? undefined,
        };
      }
    }
    console.error('Quotation trip conversion failed:', error);
    await admin
      .from('business_quotation_items')
      .update({ conversion_error: error.message.slice(0, 500) })
      .eq('id', item.id);
    return { itemId: item.id, status: 'failed', error: friendlyError(error.message) };
  }

  const result = (created ?? {}) as { group_id?: string | null; group_number?: string | null; booking_ids?: string[] };
  const bookingIds = result.booking_ids ?? [];
  if (bookingIds.length === 0) {
    return { itemId: item.id, status: 'failed', error: 'Could not create this booking' };
  }

  const { data: first } = await admin
    .from('business_bookings')
    .select('booking_number')
    .eq('id', bookingIds[0])
    .single();
  const created0 = { bookingId: bookingIds[0], bookingNumber: first?.booking_number ?? null, groupId: result.group_id ?? null };

  // Add-ons ride every journey, as in the wizard. A child seat that fails to attach is reported
  // and the trip left unstamped, the same rule convertQuotationItem applies.
  if (trip.addons.length > 0) {
    const { error: addonError } = await admin.from('business_booking_addons').insert(
      bookingIds.flatMap((bookingId) =>
        trip.addons.map((addon) => ({
          business_booking_id: bookingId,
          addon_id: addon.addon_id,
          quantity: addon.quantity,
          unit_price: addon.unit_price,
          total_price: addon.total_price,
          child_ages: addon.child_ages,
        }))
      )
    );
    if (addonError) {
      console.error('Failed to attach addons to converted trip:', addonError);
      if (trip.addons.some((a) => a.child_ages !== null)) {
        console.error('OPS ALERT: converted trip is missing its child-seat addons', { bookingIds, quotationItemId: item.id });
        return {
          itemId: item.id,
          status: 'failed',
          error:
            `Booking ${created0.bookingNumber} was created and charged, but the child seat could not be recorded. ` +
            'Do not re-convert. Contact support with this booking number.',
        };
      }
    }
  }

  await stampTripConverted(admin, item.id, created0);
  const body = tripBodyFor(quotation, item) as BusinessTripCreationInput;
  return {
    itemId: item.id,
    status: 'converted',
    bookingId: created0.bookingId,
    bookingNumber: created0.bookingNumber ?? undefined,
    email: {
      body: { ...body, reference_number: quotation.quotation_number },
      trip,
      bookingIds,
      groupNumber: result.group_number ?? null,
    },
  };
}

interface CreatedTrip {
  /** The first journey, or the only booking of an hourly hire. */
  bookingId: string;
  bookingNumber: string | null;
  groupId: string | null;
}

async function recoverTripByNonce(admin: Admin, nonce: string): Promise<CreatedTrip | null> {
  const { data: group } = await admin
    .from('business_booking_groups')
    .select('id')
    .eq('price_signature_nonce', nonce)
    .maybeSingle();

  const query = admin.from('business_bookings').select('id, booking_number');
  const { data: booking } = group
    ? await query.eq('booking_group_id', group.id).order('leg_index', { ascending: true }).limit(1).maybeSingle()
    : await query.eq('price_signature_nonce', nonce).maybeSingle();

  if (!booking) return null;
  return { bookingId: booking.id, bookingNumber: booking.booking_number, groupId: group?.id ?? null };
}

/** bqi_conversion_stamp needs the booking id and converted_at together. */
async function stampTripConverted(admin: Admin, itemId: string, created: CreatedTrip): Promise<void> {
  const { error } = await admin
    .from('business_quotation_items')
    .update({
      converted_booking_id: created.bookingId,
      converted_booking_number: created.bookingNumber,
      converted_group_id: created.groupId,
      converted_at: new Date().toISOString(),
      conversion_error: null,
    })
    .eq('id', itemId);
  if (error) console.error('Failed to stamp converted quotation trip:', error);
}
