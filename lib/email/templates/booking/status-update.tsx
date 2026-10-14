import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import { emailStyles, statusColors } from '../../styles/constants';

interface BookingStatusUpdateEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  previousStatus: string;
  newStatus: string;
  statusMessage?: string;
  vehicleCategory: string;
  pickupDate: string;
}

export const BookingStatusUpdateEmail = ({
  customerName,
  bookingReference,
  tripNumber,
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
      preview={`Booking Status Update - ${tripNumber || bookingReference}`}
      heading="Booking Status Update"
      eyebrow="Status update"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        Your booking status has been updated. Here are the details:
      </Text>

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Vehicle Category">{vehicleCategory}</DetailRow>
        <DetailRow label="Pickup Date">{pickupDate}</DetailRow>
        <DetailRow label="Status Changed">
          <span style={{ color: statusColors.pending }}>{previousStatus}</span>
          {' → '}
          <span style={{ color: getStatusColor(newStatus), fontWeight: 'bold' }}>
            {newStatus}
          </span>
        </DetailRow>
      </DetailsSection>

      {statusMessage && (
        <InfoBox type="message" title="Additional Information:">
          {statusMessage}
        </InfoBox>
      )}

      <Text style={emailStyles.text}>
        Contact support with your trip number if you have questions about this update.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingStatusUpdateEmail;
