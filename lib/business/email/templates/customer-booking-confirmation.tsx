import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import Journey from '../components/journey';
import SectionLabel from '../components/section-label';
import { emailStyles } from '../styles/constants';
import { formatGuestSummary } from '@/lib/business/guest-breakdown';
import { formatChildAges } from '@/lib/business/format-child-ages';
import { getBusinessBrand } from '../brand';
import TripJourneys from '../components/trip-journeys';
import { businessTripEmailReference, type BusinessEmailTrip } from '../trip';

interface CustomerBookingConfirmationEmailProps {
  customerName: string;
  customerPhone?: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  /** Every guest (adults + children + infants). */
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  referenceNumber?: string;
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
  /** Round trip, multi-city or hourly. Absent for one way, which renders as before. */
  trip?: BusinessEmailTrip;
}

export const CustomerBookingConfirmationEmail = ({
  customerName,
  customerPhone,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  vehicleType,
  passengerCount,
  adults,
  children,
  infants,
  referenceNumber,
  extras,
  trip,
}: CustomerBookingConfirmationEmailProps) => {
  const reference = businessTripEmailReference(trip, tripNumber || bookingNumber);
  const hasJourneys = Boolean(trip?.journeys?.length);
  // Older bookings predate the guest breakdown. Fall back to the seated count.
  const passengerLabel =
    adults != null
      ? formatGuestSummary({ adults, children: children ?? 0, infants: infants ?? 0 })
      : passengerCount;

  return (
    <EmailLayout
      preview={`Your Transfer Booking - ${reference}`}
      heading="Your Transfer Has Been Booked"
      eyebrow="Booking confirmed"
      tone="success"
      reference={{ label: 'Trip', value: reference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        Your transfer has been booked by <strong>{businessName}</strong>.
        Your {trip ? trip.label.toLowerCase() + ' ' : ''}trip number is <strong>#{reference}</strong>
      </InfoBox>

      <SectionLabel>Trip Details</SectionLabel>

      {!hasJourneys && (
        <Journey when={pickupDateTime} pickup={pickupLocation} dropoff={dropoffLocation} />
      )}

      <DetailsSection>
        <DetailRow label="Trip #">{reference}</DetailRow>
        {referenceNumber && <DetailRow label="Reference #">{referenceNumber}</DetailRow>}
        <DetailRow label="Vehicle">{vehicleType}</DetailRow>
        <DetailRow label="Passengers">{passengerLabel}</DetailRow>
        {customerPhone && <DetailRow label="Contact">{customerPhone}</DetailRow>}
        {extras && extras.length > 0 && (
          <>
            <Hr style={emailStyles.hr} />
            {extras.map((extra, index) => (
              // Prices stay hidden here. The end customer books through the business, not us.
              <DetailRow key={index} label="Extra">
                {extra.label}
                {extra.quantity > 1 ? ` x${extra.quantity}` : ''}
                {formatChildAges(extra.childAges)}
              </DetailRow>
            ))}
          </>
        )}
      </DetailsSection>

      {/* No currency: the passenger never sees prices. */}
      {trip && <TripJourneys trip={trip} />}

      <InfoBox type="info" title="What to Expect">
        A driver will be assigned to your transfer. Please be ready at the pickup
        location at the scheduled time.
      </InfoBox>

      <Text style={emailStyles.text}>
        If you have any questions about your transfer, please contact{' '}
        <strong>{businessName}</strong> or our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default CustomerBookingConfirmationEmail;
