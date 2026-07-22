import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles, statusColors } from '../../styles/constants';

/** Tells the customer their offline booking moved between statuses. */
interface DirectBookingCustomerStatusUpdateEmailProps {
  customerName: string;
  bookingReference: string;
  previousStatusLabel: string;
  newStatusLabel: string;
  vehicleLabel: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
  vendorPhone?: string;
}

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('confirmed')) return statusColors.confirmed;
  if (statusLower.includes('completed')) return statusColors.completed;
  if (statusLower.includes('cancelled')) return statusColors.cancelled;
  if (statusLower.includes('progress')) return statusColors.progress;
  return statusColors.default;
};

export const DirectBookingCustomerStatusUpdateEmail = ({
  customerName,
  bookingReference,
  previousStatusLabel,
  newStatusLabel,
  vehicleLabel,
  pickupDate,
  pickupTime,
  vendorName,
  vendorPhone,
}: DirectBookingCustomerStatusUpdateEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Update - ${bookingReference}`}
      heading="Booking Status Update"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {vendorName} has updated the status of your booking.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleLabel}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupDate} at {pickupTime}
        </Text>
        <Text style={{ ...emailStyles.detailRow, marginTop: '16px' }}>
          <strong>Status Changed:</strong>
        </Text>
        <Text style={emailStyles.detailRow}>
          <span style={{ color: statusColors.pending }}>{previousStatusLabel}</span>
          {' → '}
          <span style={{ color: getStatusColor(newStatusLabel), fontWeight: 'bold' }}>
            {newStatusLabel}
          </span>
        </Text>
      </DetailsSection>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        Questions? Contact {vendorName}
        {vendorPhone ? ` on ${vendorPhone}` : ''} and quote your booking reference.
        <br />
        <br />
        Best regards,
        <br />
        {vendorName}
      </Text>
    </EmailLayout>
  );
};

export default DirectBookingCustomerStatusUpdateEmail;
