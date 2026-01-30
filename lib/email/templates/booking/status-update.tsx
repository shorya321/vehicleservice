import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles, statusColors } from '../../styles/constants';

interface BookingStatusUpdateEmailProps {
  customerName: string;
  bookingReference: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
  vehicleCategory: string;
  pickupDate: string;
}

export const BookingStatusUpdateEmail = ({
  customerName,
  bookingReference,
  previousStatus,
  newStatus,
  statusMessage,
  vehicleCategory,
  pickupDate,
}: BookingStatusUpdateEmailProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('confirmed')) return statusColors.confirmed;
    if (statusLower.includes('completed')) return statusColors.completed;
    if (statusLower.includes('cancelled')) return statusColors.cancelled;
    if (statusLower.includes('progress')) return statusColors.progress;
    return statusColors.default;
  };

  return (
    <EmailLayout
      preview={`Booking Status Update - ${bookingReference}`}
      heading="Booking Status Update"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        Your booking status has been updated. Here are the details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle Category:</strong> {vehicleCategory}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={{ ...emailStyles.detailRow, marginTop: '16px' }}>
          <strong>Status Changed:</strong>
        </Text>
        <Text style={emailStyles.detailRow}>
          <span style={{ color: statusColors.pending }}>{previousStatus}</span>
          {' → '}
          <span style={{ color: getStatusColor(newStatus), fontWeight: 'bold' }}>
            {newStatus}
          </span>
        </Text>
      </DetailsSection>

      {statusMessage && (
        <InfoBox type="message" title="Additional Information:">
          {statusMessage}
        </InfoBox>
      )}

      <Text style={emailStyles.text}>
        If you have any questions about this status update, please don&apos;t hesitate to contact our
        support team with your booking reference number.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BookingStatusUpdateEmail;
