import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown';
import { formatChildAges } from '@/lib/utils/child-ages';
import TripDetails from '../../components/trip-details';
import DetailRow from '../../components/detail-row';
import FareLedger from '../../components/fare-ledger';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import type { EmailTripDetails } from '../../types';

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  vehicleCategory: string;
  vehicleType?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  /** Total guests (adults + children + infants). */
  passengerCount?: number;
  adults?: number;
  children?: number;
  infants?: number;
  basePrice?: number;
  amenitiesPrice?: number;
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
  customerNotes?: string;
  invoiceUrl?: string;
  trip?: EmailTripDetails;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingReference,
  tripNumber,
  vehicleCategory,
  vehicleType,
  passengerCapacity,
  luggageCapacity,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  totalAmount,
  currency,
  originalAmount,
  originalCurrency,
  passengerCount,
  adults,
  children,
  infants,
  basePrice,
  amenitiesPrice: _amenitiesPrice,
  extras,
  customerNotes,
  invoiceUrl,
  trip,
}: BookingConfirmationEmailProps) => {
  const isGrouped = !!trip?.legs && trip.legs.length > 0;
  const isHourly = trip?.tripType === 'hourly';
  const baseFareLabel = isGrouped ? 'Journey fares' : isHourly ? 'Hire package' : 'Base Fare';
  const hasBookingSummary = passengerCount != null && basePrice != null;
  // Bookings that predate the guest breakdown fall back to the plain total.
  const passengerLabel =
    adults != null
      ? formatGuestSummary({ adults, children: children ?? 0, infants: infants ?? 0 })
      : passengerCount;
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  return (
    <EmailLayout
      preview={`Booking Confirmed - ${tripNumber || bookingReference}`}
      heading="Booking Confirmation"
      eyebrow="Booking confirmed"
      tone="success"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        Your booking is confirmed. Here are the details:
      </Text>

      {isGrouped && trip ? (
        <>
          <SectionLabel>Your journeys</SectionLabel>
          <TripDetails trip={trip} currency={currency} />
        </>
      ) : (
        <>
          <SectionLabel>Your journey</SectionLabel>
          <Journey
            time={pickupTime}
            date={pickupDate}
            pickup={pickupLocation}
            dropoff={isHourly ? undefined : dropoffLocation}
          />
        </>
      )}

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Vehicle Category">{vehicleCategory}</DetailRow>
        {vehicleType && <DetailRow label="Vehicle Type">{vehicleType}</DetailRow>}
        {(passengerCapacity || luggageCapacity) && (
          <Text style={{ ...emailStyles.muted, margin: '2px 0 6px' }}>
            {passengerCapacity ? `Up to ${passengerCapacity} passengers` : ''}
            {passengerCapacity && luggageCapacity ? ' · ' : ''}
            {luggageCapacity ? `Up to ${luggageCapacity} luggage` : ''}
          </Text>
        )}
        {passengerLabel != null && <DetailRow label="Passengers">{passengerLabel}</DetailRow>}
        {!isGrouped && isHourly && trip ? (
          <>
            <Hr style={emailStyles.hr} />
            <TripDetails trip={trip} currency={currency} />
          </>
        ) : null}
        {customerNotes && (
          <>
            <Hr style={emailStyles.hr} />
            <DetailRow label="Special Requests">{customerNotes}</DetailRow>
          </>
        )}
      </DetailsSection>

      <SectionLabel>{hasBookingSummary ? 'Booking Summary' : 'Payment'}</SectionLabel>
      {hasBookingSummary ? (
        <FareLedger
          items={[
            {
              label: `${baseFareLabel} (${passengerCount} Passenger${passengerCount !== 1 ? 's' : ''})`,
              amount: `${currency} ${basePrice.toFixed(2)}`,
            },
            ...(extras ?? []).map((extra) => ({
              label: `${extra.label}${extra.quantity > 1 ? ` x${extra.quantity}` : ''}${formatChildAges(extra.childAges)}`,
              amount: `${currency} ${extra.price.toFixed(2)}`,
            })),
          ]}
          totalLabel="Total Amount"
          total={`${currency} ${totalAmount.toFixed(2)}`}
          note={
            showChargeNote
              ? `Payment charged in ${originalCurrency} ${originalAmount!.toFixed(2)}`
              : undefined
          }
        />
      ) : (
        <FareLedger
          items={[]}
          totalLabel="Total Amount"
          total={`${currency} ${totalAmount.toFixed(2)}`}
          note={
            showChargeNote
              ? `Payment charged in ${originalCurrency} ${originalAmount!.toFixed(2)}`
              : undefined
          }
        />
      )}

      {invoiceUrl && (
        <>
          <Button href={invoiceUrl}>Download Invoice (PDF)</Button>
          <Text style={{ ...emailStyles.muted, margin: '8px 0 16px' }}>
            Keep this invoice for your records.
          </Text>
        </>
      )}

      <Text style={{ ...emailStyles.text, marginTop: '24px' }}>
        We&apos;ll send you updates about your booking, including vendor assignment and any changes to
        your reservation.
      </Text>

      <Text style={emailStyles.text}>
        To change this booking or ask a question, contact support with your trip number.
      </Text>

      <Text style={emailStyles.text}>
        Thanks for booking with Infinia Transfers.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingConfirmationEmail;
