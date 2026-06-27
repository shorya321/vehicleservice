import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface BusinessBookingStatusUpdateEmailProps {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
}

const statusInfoType: Record<string, 'success' | 'warning' | 'info'> = {
  confirmed: 'success',
  completed: 'success',
  cancelled: 'warning',
  in_progress: 'info',
  assigned: 'info',
  pending: 'info',
};

const statusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const BusinessBookingStatusUpdateEmail = ({
  businessName,
  bookingNumber,
  tripNumber,
  customerName,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  previousStatus,
  newStatus,
  statusMessage,
}: BusinessBookingStatusUpdateEmailProps) => {
  const infoType = statusInfoType[newStatus] || 'info';

  return (
    <EmailLayout
      preview={`Booking ${statusLabel(newStatus)} - ${tripNumber || bookingNumber}`}
      heading="Booking Status Update"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type={infoType}>
        Booking <strong>#{tripNumber || bookingNumber}</strong> status changed from{' '}
        <strong>{statusLabel(previousStatus)}</strong> to{' '}
        <strong>{statusLabel(newStatus)}</strong>.
      </InfoBox>

      {statusMessage && (
        <Text style={emailStyles.text}>{statusMessage}</Text>
      )}

      <Text style={emailStyles.text}>
        <strong>Booking Details:</strong>
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
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
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
      </DetailsSection>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingStatusUpdateEmail;
