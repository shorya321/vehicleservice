import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface CustomerBookingCancelledEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
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
}: CustomerBookingCancelledEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${tripNumber || bookingNumber}`}
      heading="Your Transfer Has Been Cancelled"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="warning">
        Your transfer booking <strong>#{tripNumber || bookingNumber}</strong> has been
        cancelled.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Cancelled Booking Details:</strong>
      </Text>

      <DetailsSection>
        {tripNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Trip #:</strong> {tripNumber}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Booking #:</strong> {bookingNumber}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Date & Time:</strong> {pickupDateTime}
        </Text>
        {cancellationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Reason:</strong> {cancellationReason}
            </Text>
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
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default CustomerBookingCancelledEmail;
