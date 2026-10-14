import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import StatBlock from '../../components/stat-block';
import { emailStyles } from '../../styles/constants';

interface BookingCancelledEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  refundDue: number | null;
  tripLabel?: string;
  groupNumber?: string;
  discountForfeited?: boolean;
}

/** Sent to the customer when they cancel a booking, or one journey of a trip. */
export const BookingCancelledEmail = ({
  customerName,
  bookingReference,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  refundDue,
  tripLabel,
  groupNumber,
  discountForfeited,
}: BookingCancelledEmailProps) => {
  const reference = tripNumber || bookingReference;
  return (
    <EmailLayout
      preview={`Booking cancelled - ${reference}`}
      heading="Booking Cancelled"
      eyebrow="Booking cancelled"
      tone="danger"
      reference={{ label: 'Trip', value: reference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {groupNumber
          ? `This journey of your trip ${groupNumber} is cancelled. The rest of your trip is unchanged.`
          : 'Your booking is cancelled.'}
      </Text>

      <SectionLabel>Your journey</SectionLabel>
      <Journey
        label="Was due"
        time={pickupTime}
        date={pickupDate}
        pickup={pickupLocation}
        dropoff={dropoffLocation}
      />

      <DetailsSection>
        <DetailRow label="Trip #">{reference}</DetailRow>
        {tripLabel && <DetailRow label="Journey">{tripLabel}</DetailRow>}
      </DetailsSection>

      {refundDue !== null && (
        <StatBlock label="Refund" value={`AED ${refundDue.toFixed(2)}`}>
          {discountForfeited &&
            'The round-trip saving no longer applies to the rest of your trip, so it is taken from this refund.'}
        </StatBlock>
      )}

      <Text style={emailStyles.text}>
        {refundDue !== null && refundDue > 0
          ? 'The refund goes back to the card you paid with. It usually appears within 5 to 10 working days.'
          : 'Nothing was charged for this booking, so there is nothing to refund.'}
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers
      </Text>
    </EmailLayout>
  );
};

export default BookingCancelledEmail;
