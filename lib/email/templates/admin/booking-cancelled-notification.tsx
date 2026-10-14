import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import DetailRow from '../../components/detail-row';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import StatBlock from '../../components/stat-block';
import { emailStyles } from '../../styles/constants';

interface AdminBookingCancelledEmailProps {
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  refundDue: number | null;
  tripLabel?: string;
  groupNumber?: string;
  discountForfeited?: boolean;
  bookingDetailsUrl: string;
}

/** Tells the platform a customer cancelled, and what to refund by hand in Stripe. */
export const AdminBookingCancelledEmail = ({
  bookingReference,
  tripNumber,
  customerName,
  customerEmail,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  refundDue,
  tripLabel,
  groupNumber,
  discountForfeited,
  bookingDetailsUrl,
}: AdminBookingCancelledEmailProps) => {
  const reference = tripNumber || bookingReference;
  return (
    <EmailLayout
      preview={`Booking cancelled by customer - ${reference}`}
      heading="Booking Cancelled by Customer"
      eyebrow="Booking cancelled"
      tone="danger"
      reference={{ label: 'Trip', value: reference }}
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        {refundDue !== null && refundDue > 0
          ? 'A customer cancelled a paid booking. Refunds are not automatic: please issue this one in Stripe.'
          : 'A customer cancelled a booking. Nothing was paid, so there is nothing to refund.'}
      </Text>

      <SectionLabel>Trip</SectionLabel>
      <Journey
        label="Was due"
        time={pickupTime}
        date={pickupDate}
        pickup={pickupLocation}
        dropoff={dropoffLocation}
      />

      <DetailsSection>
        <DetailRow label="Trip #">{reference}</DetailRow>
        {groupNumber && <DetailRow label="Part of trip">{groupNumber}</DetailRow>}
        {tripLabel && <DetailRow label="Journey">{tripLabel}</DetailRow>}
        <DetailRow label="Customer">
          {customerName} ({customerEmail})
        </DetailRow>
      </DetailsSection>

      {refundDue !== null && (
        <StatBlock label="Refund due" value={`AED ${refundDue.toFixed(2)}`}>
          {discountForfeited
            ? 'Net of the round-trip saving the remaining journey no longer qualifies for.'
            : null}
        </StatBlock>
      )}

      <Button href={bookingDetailsUrl}>View Booking</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default AdminBookingCancelledEmail;
