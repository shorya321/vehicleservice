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
import { BRAND_NAME, BRAND_ADDRESS } from '@/lib/email/config';
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone';
import { jsx } from 'react/jsx-runtime';

export const dynamic = 'force-dynamic';

const AMENITY_LABELS: Record<string, string> = {
  child_seat_infant: 'Infant seat',
  child_seat_booster: 'Booster seat',
  extra_luggage: 'Extra luggage',
};

const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIMEZONE,
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
        booking_amenities (amenity_type, quantity, price, addon:addons (name)),
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

    // Prices are always stored in AED — conversion is display-only.
    const toDisplay = (amountAed: number) => formatPrice(amountAed ?? 0, currency, exchangeRates);

    const primaryPassenger =
      booking.booking_passengers?.find((p) => p.is_primary) ?? booking.booking_passengers?.[0];

    const lineItems: BookingInvoiceLineItem[] = [
      {
        label: `Base fare · ${booking.passenger_count} passenger${booking.passenger_count > 1 ? 's' : ''}`,
        quantity: 1,
        amount: toDisplay(booking.base_price),
      },
      // booking_amenities.price is the LINE TOTAL, not a unit price — never multiply by quantity.
      ...(booking.booking_amenities ?? []).map((amenity) => {
        const addon = amenity.addon as unknown as { name: string } | null;
        const label =
          amenity.amenity_type === 'addon' && addon
            ? addon.name
            : AMENITY_LABELS[amenity.amenity_type] ?? amenity.amenity_type;

        return {
          label,
          quantity: amenity.quantity ?? 1,
          amount: toDisplay(amenity.price),
        };
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
      luggageCount: booking.luggage_count ?? undefined,

      lineItems,
      // The total is printed from total_price verbatim — never recomputed from line items.
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
