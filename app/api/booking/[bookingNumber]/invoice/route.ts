/**
 * Customer Booking Invoice PDF
 * GET: Generate and download the invoice for a paid booking.
 *
 * Auth model mirrors /booking/confirmation/[bookingNumber]: the booking number is
 * the bearer secret. Guest bookings have no account, so requiring a session here
 * would break the invoice link in the confirmation email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BookingInvoicePDF, type BookingInvoiceLineItem } from '@/lib/pdf/generators/booking-invoice';
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator';
import { getEnabledCurrencies, getExchangeRates } from '@/lib/currency/server';
import { formatPrice, formatAmount } from '@/lib/currency/format';
// The customer copy, never lib/business/format-child-ages.ts, which the business module owns.
import { formatChildAges } from '@/lib/utils/child-ages';
import { BRAND_NAME, BRAND_ADDRESS } from '@/lib/email/config';
import { getBookingTimezone } from '@/lib/utils/timezone';
import { jsx } from 'react/jsx-runtime';

export const dynamic = 'force-dynamic';

const AMENITY_LABELS: Record<string, string> = {
  child_seat_infant: 'Infant seat',
  child_seat_booster: 'Booster seat',
  extra_luggage: 'Extra luggage',
};

const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: getBookingTimezone(),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: getBookingTimezone(),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> }
) {
  try {
    const { bookingNumber } = await params;
    const supabase = createAdminClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `
        booking_number,
        trip_number,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        passenger_count,
        adults,
        children,
        infants,
        luggage_count,
        base_price,
        total_price,
        payment_status,
        payment_method_details,
        paid_at,
        created_at,
        booking_passengers (first_name, last_name, email, phone, is_primary),
        booking_amenities (amenity_type, quantity, price, child_ages, addon:addons (name)),
        vehicle_type:vehicle_types (name)
      `
      )
      .eq('booking_number', bookingNumber)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // An unpaid booking has no invoice.
    if (booking.payment_status !== 'completed') {
      return NextResponse.json({ error: 'Invoice not available for this booking' }, { status: 404 });
    }

    // Resolve display currency: validate against enabled currencies, fall back to AED.
    const requested = request.nextUrl.searchParams.get('currency')?.toUpperCase();
    const [enabledCurrencies, exchangeRates] = await Promise.all([
      getEnabledCurrencies(),
      getExchangeRates(),
    ]);
    const currency =
      requested && enabledCurrencies.some((c) => c.code === requested) ? requested : 'AED';

    // Prices are always stored in AED. Conversion is display-only.
    const toDisplay = (amountAed: number) => formatPrice(amountAed ?? 0, currency, exchangeRates);

    /**
     * Splits a stored line total into the unit price and line total the table prints.
     *
     * booking_amenities.price is the EXTENDED price (unit x quantity, written by
     * app/checkout/actions.ts), so the unit is recovered by dividing. Only the unit is derived -
     * the Amount column stays the converted stored figure, so the lines still add up to Total
     * Paid and still match the thank-you page and the confirmation email to the cent. In AED,
     * the currency actually charged, the division is exact and Qty x Unit Price = Amount holds
     * outright; a converted unit can round a cent off that product, which is what the existing
     * "converted amounts are indicative" note covers.
     */
    const splitLine = (lineTotalAed: number, quantity: number) => ({
      unitAmount: toDisplay(lineTotalAed / quantity),
      amount: toDisplay(lineTotalAed),
    });

    const primaryPassenger =
      booking.booking_passengers?.find((p) => p.is_primary) ?? booking.booking_passengers?.[0];

    const lineItems: BookingInvoiceLineItem[] = [
      {
        label: `Base fare · ${booking.passenger_count} passenger${booking.passenger_count > 1 ? 's' : ''}`,
        quantity: 1,
        unitAmount: toDisplay(booking.base_price),
        amount: toDisplay(booking.base_price),
      },
      ...(booking.booking_amenities ?? []).map((amenity) => {
        const addon = amenity.addon as unknown as { name: string } | null;
        const baseLabel =
          amenity.amenity_type === 'addon' && addon
            ? addon.name
            : AMENITY_LABELS[amenity.amenity_type] ?? amenity.amenity_type;
        // Matches the thank-you page and the confirmation email, which both name the ages.
        const label = `${baseLabel}${formatChildAges(amenity.child_ages)}`;
        const quantity = Math.max(1, amenity.quantity ?? 1);

        return { label, quantity, ...splitLine(amenity.price, quantity) };
      }),
    ];

    const paymentDetails = booking.payment_method_details as { type?: string } | null;
    const issuedAt = booking.paid_at ?? booking.created_at ?? new Date().toISOString();
    const vehicleType = booking.vehicle_type as unknown as { name: string } | null;
    const invoiceNumber = booking.trip_number || booking.booking_number;

    const pdfData = {
      invoiceNumber,
      issuedDate: formatDate(issuedAt),
      paymentMethod: paymentDetails?.type
        ? paymentDetails.type.charAt(0).toUpperCase() + paymentDetails.type.slice(1)
        : undefined,

      companyName: BRAND_NAME,
      companyAddress: BRAND_ADDRESS,
      companyEmail: process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_FROM_EMAIL,

      customerName: primaryPassenger
        ? `${primaryPassenger.first_name} ${primaryPassenger.last_name}`
        : 'Customer',
      customerEmail: primaryPassenger?.email ?? undefined,
      customerPhone: primaryPassenger?.phone ?? undefined,

      pickupAddress: booking.pickup_address,
      dropoffAddress: booking.dropoff_address,
      pickupDatetime: booking.pickup_datetime ? formatDateTime(booking.pickup_datetime) : undefined,
      vehicleTypeName: vehicleType?.name,
      passengerCount: booking.passenger_count,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      // No customer-facing bag picker writes this yet, so a stored 0 means "unknown", not "none".
      luggageCount: booking.luggage_count && booking.luggage_count > 0 ? booking.luggage_count : undefined,

      lineItems,
      // The total is printed from total_price verbatim, never recomputed from line items.
      totalDisplay: toDisplay(booking.total_price),
      totalAed: formatAmount(booking.total_price ?? 0, 'AED'),
      showAedNote: currency !== 'AED',

      generatedDate: formatDateTime(new Date().toISOString()),
    };

    const pdfBuffer = await generatePDFBuffer(jsx(BookingInvoicePDF, pdfData));
    const fileName = `invoice-${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: getPDFDownloadHeaders(fileName),
    });
  } catch (error) {
    console.error('Error generating booking invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
