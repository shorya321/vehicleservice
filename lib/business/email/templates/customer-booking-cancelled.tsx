import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import Journey from '../components/journey';
import SectionLabel from '../components/section-label';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface CustomerBookingCancelledEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
  /** "Round trip BG-..., return journey" when this booking is one journey of a trip. */
  tripContext?: string;
}

export const CustomerBookingCancelledEmail = ({
  customerName,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  cancellationReason,
  tripContext,
}: CustomerBookingCancelledEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${tripNumber || bookingNumber}`}
      heading="Your Transfer Has Been Cancelled"
      eyebrow="Booking cancelled"
      tone="danger"
      reference={{ label: 'Trip', value: tripNumber || bookingNumber }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="warning">
        Your transfer booking <strong>#{tripNumber || bookingNumber}</strong> has been
        cancelled.
      </InfoBox>

      <SectionLabel>Cancelled Booking Details</SectionLabel>

      <Journey when={pickupDateTime} pickup={pickupLocation} dropoff={dropoffLocation} />

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        {tripContext && <DetailRow label="Part of">{tripContext}</DetailRow>}
        {cancellationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <DetailRow label="Reason">{cancellationReason}</DetailRow>
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        If you have any questions about this cancellation, please contact{' '}
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

export default CustomerBookingCancelledEmail;
