/**
 * Confirmation emails for a business trip: ONE set per trip (owner + creator, passenger, admin),
 * listing every journey, never one set per journey.
 * SCOPE: Business module ONLY.
 *
 * Runs inside after(). Every send is awaited (allSettled) so a serverless host keeps the
 * invocation alive until the mail and its delivery-log row are written.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { BusinessUserContext } from '@/lib/business/api-utils';
import { sendBusinessCustomerBookingConfirmationEmail } from '@/lib/business/email/services/business-emails';
import { notifyBusinessBookingCreated } from '@/lib/business/email/notify';
import { buildBusinessSideRecipients } from '@/lib/business/email/recipients';
import type { BusinessEmailTrip } from '@/lib/business/email/trip';
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails';
import type { EmailTripDetails } from '@/lib/email/types';
import { getAdminEmail, getAppUrl } from '@/lib/email/config';
import { getExchangeRates } from '@/lib/currency/server';
import { BUSINESS_BASE_CURRENCY, convertFromAed } from '@/lib/business/wallet-operations';
import { getBookingTimezone } from '@/lib/business/utils/timezone';
import { BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import { businessHourlySummary, businessLegLabel } from '@/lib/business/trips/display';
import type { BusinessTripCreationInput } from '@/lib/business/trips/schemas';
import type { PricedBusinessTrip } from '@/lib/business/trips/price-trip-server';

interface TripEmailInput {
  supabase: SupabaseClient<Database>;
  user: BusinessUserContext;
  body: BusinessTripCreationInput;
  trip: PricedBusinessTrip;
  bookingIds: string[];
  groupNumber: string | null;
}

const withAddress = (name: string | null, address: string): string =>
  name ? `${name}${address ? ` - ${address}` : ''}` : address || 'N/A';

const dateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', { timeZone: getBookingTimezone(), dateStyle: 'full', timeStyle: 'short' });
const dateOnly = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: getBookingTimezone(), weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
const timeOnly = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', { timeZone: getBookingTimezone(), hour: '2-digit', minute: '2-digit' });

export async function sendTripCreatedEmails(input: TripEmailInput): Promise<void> {
  const { supabase, user, body, trip, bookingIds, groupNumber } = input;

  try {
    const [{ data: rows }, { data: account }] = await Promise.all([
      supabase
        .from('business_bookings')
        .select('id, booking_number, trip_number, leg_index, trip_type, hourly_package, duration_hours, included_km')
        .in('id', bookingIds)
        .order('leg_index', { ascending: true, nullsFirst: true }),
      supabase
        .from('business_accounts')
        .select('business_name, business_email, wallet_balance, preferred_currency')
        .eq('id', user.businessAccountId)
        .single(),
    ]);
    const first = rows?.[0];
    if (!first || !account) return;

    const legCount = trip.legs.length;
    const label = BUSINESS_TRIP_TYPE_LABELS[body.trip_type];
    const journeys = groupNumber
      ? trip.legs.map((leg, index) => ({
          label: businessLegLabel({ trip_type: body.trip_type, leg_index: index }, legCount) ?? `Journey ${index + 1}`,
          tripNumber: rows?.[index]?.trip_number ?? undefined,
          pickupLocation: withAddress(leg.from_name, leg.pickup_address),
          dropoffLocation: withAddress(leg.to_name, leg.dropoff_address),
          pickupDateTime: dateTime(leg.pickup_datetime),
        }))
      : undefined;
    const hourlySummary = businessHourlySummary(first) ?? undefined;

    const displayCurrency = account.preferred_currency || BUSINESS_BASE_CURRENCY;
    const rates = await getExchangeRates();
    const toDisplay = (aed: number) => convertFromAed(aed, displayCurrency, rates);
    const isConverted = displayCurrency !== BUSINESS_BASE_CURRENCY;

    const baseTrip: BusinessEmailTrip = { label, groupNumber: groupNumber ?? undefined, hourlySummary, journeys };
    const ownerTrip: BusinessEmailTrip = { ...baseTrip, discountAmount: toDisplay(trip.quote.discount) };

    // Add-ons ride every journey, so the line shows what was charged across the trip.
    const extras = trip.addons.map((addon) => ({
      label: legCount > 1 ? `${addon.name} (each journey)` : addon.name,
      quantity: addon.quantity,
      price: addon.total_price * legCount,
      childAges: addon.child_ages ?? undefined,
    }));

    const lead = trip.legs[0];
    const pickupLocation = withAddress(lead.from_name, lead.pickup_address);
    const dropoffLocation = withAddress(lead.to_name, lead.dropoff_address);
    const vehicleType = trip.vehicle.name || 'Standard';
    const bookingUrl = `${getAppUrl()}/business/bookings/${first.id}`;

    const recipients = buildBusinessSideRecipients({
      ownerEmail: account.business_email,
      ownerName: account.business_name,
      creator: {
        memberId: user.businessId,
        email: user.memberEmail,
        name: user.memberName,
        role: user.role,
        isActive: true,
      },
    });

    const sends: Promise<unknown>[] = [];

    sends.push(notifyBusinessBookingCreated(recipients, {
      businessAccountId: user.businessAccountId,
      businessName: account.business_name,
      bookingNumber: first.booking_number,
      tripNumber: first.trip_number,
      customerName: body.customer_name,
      customerPhone: body.customer_phone,
      pickupLocation,
      dropoffLocation,
      pickupDateTime: dateTime(lead.pickup_datetime),
      vehicleType,
      passengerCount: body.passenger_count,
      adults: body.adults,
      children: body.children,
      infants: body.infants,
      totalPrice: toDisplay(trip.quote.total),
      currency: displayCurrency,
      originalAmount: isConverted ? trip.quote.total : undefined,
      originalCurrency: isConverted ? BUSINESS_BASE_CURRENCY : undefined,
      walletDeducted: toDisplay(trip.quote.total),
      newBalance: toDisplay(account.wallet_balance),
      bookingUrl,
      referenceNumber: body.reference_number,
      extras: extras.map((e) => ({ ...e, price: toDisplay(e.price) })),
      trip: ownerTrip,
    }).catch((err: unknown) => console.error('Failed to send trip confirmation email:', err)));

    sends.push(sendBusinessCustomerBookingConfirmationEmail({
      businessAccountId: user.businessAccountId,
      customerName: body.customer_name,
      customerEmail: body.customer_email,
      customerPhone: body.customer_phone,
      businessName: account.business_name,
      bookingNumber: first.booking_number,
      tripNumber: first.trip_number,
      pickupLocation,
      dropoffLocation,
      pickupDateTime: dateTime(lead.pickup_datetime),
      vehicleType,
      passengerCount: body.passenger_count,
      adults: body.adults,
      children: body.children,
      infants: body.infants,
      referenceNumber: body.reference_number,
      extras,
      trip: baseTrip,
    }).catch((err: unknown) => console.error('Failed to send customer trip confirmation email:', err)));

    const adminTrip: EmailTripDetails = {
      tripType: body.trip_type,
      label,
      hourlySummary,
      groupNumber: groupNumber ?? undefined,
      discountAmount: trip.quote.discount > 0 ? trip.quote.discount : undefined,
      extraHourPrice: trip.hourly?.extraHourPrice,
      legs: journeys?.map((journey, index) => ({
        label: journey.label,
        tripNumber: journey.tripNumber,
        pickupLocation: journey.pickupLocation,
        dropoffLocation: journey.dropoffLocation,
        pickupDate: dateOnly(trip.legs[index].pickup_datetime),
        pickupTime: timeOnly(trip.legs[index].pickup_datetime),
      })),
    };

    try {
      sends.push(sendNewBookingNotificationEmail({
        adminEmail: getAdminEmail(),
        bookingId: first.id,
        bookingReference: groupNumber ?? first.booking_number,
        tripNumber: first.trip_number,
        customerName: body.customer_name,
        customerEmail: body.customer_email,
        customerPhone: body.customer_phone || 'Not provided',
        vehicleCategory: trip.vehicle.categoryName || 'Vehicle',
        vehicleType,
        pickupLocation,
        dropoffLocation,
        pickupDate: dateOnly(lead.pickup_datetime),
        pickupTime: timeOnly(lead.pickup_datetime),
        totalAmount: trip.quote.total,
        currency: BUSINESS_BASE_CURRENCY,
        bookingDetailsUrl: `${getAppUrl()}/admin/bookings/${first.id}`,
        trip: adminTrip,
      }).catch((err: unknown) => console.error('Failed to send admin trip notification email:', err)));
    } catch (err: unknown) {
      console.error('Admin notification email not configured:', err);
    }

    await Promise.allSettled(sends);
  } catch (error) {
    console.error('Trip confirmation emails failed:', error);
  }
}
