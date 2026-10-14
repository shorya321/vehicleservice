import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
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
      eyebrow="Status update"
      reference={{ label: 'Booking', value: bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {vendorName} has updated the status of your booking.
      </Text>

      <DetailsSection>
        <DetailRow label="Booking Reference">{bookingReference}</DetailRow>
        <DetailRow label="Vehicle">{vehicleLabel}</DetailRow>
        <DetailRow label="Pickup">
          {pickupDate} at {pickupTime}
        </DetailRow>
        <DetailRow label="Status Changed">
          <span style={{ color: statusColors.pending }}>{previousStatusLabel}</span>
          {' → '}
          <span style={{ color: getStatusColor(newStatusLabel), fontWeight: 'bold' }}>
            {newStatusLabel}
          </span>
        </DetailRow>
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
