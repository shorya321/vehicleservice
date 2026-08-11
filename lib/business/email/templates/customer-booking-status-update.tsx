import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../platform';

interface BusinessCustomerBookingStatusUpdateEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
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

/**
 * The passenger's copy of a booking status change.
 *
 * Split from the owner-facing BusinessBookingStatusUpdateEmail, which opens
 * "Hi {businessName}". That template was being sent to the passenger as well, so a
 * customer of Acme Hotel received an email greeting them as "Hi Acme Hotel,".
 *
 * Written in the business's voice to its own customer: no internal status vocabulary
 * beyond the change itself, and no hint that a platform exists behind the business.
 */
export const BusinessCustomerBookingStatusUpdateEmail = ({
  customerName,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  previousStatus,
  newStatus,
  statusMessage,
}: BusinessCustomerBookingStatusUpdateEmailProps) => {
  const infoType = statusInfoType[newStatus] || 'info';

  return (
    <EmailLayout
      preview={`Your booking is ${statusLabel(newStatus)} - ${tripNumber || bookingNumber}`}
      heading="Your Booking Has Been Updated"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        There is an update to your booking with {businessName}.
      </Text>

      <InfoBox type={infoType}>
        Your booking <strong>#{tripNumber || bookingNumber}</strong> has changed from{' '}
        <strong>{statusLabel(previousStatus)}</strong> to{' '}
        <strong>{statusLabel(newStatus)}</strong>.
      </InfoBox>

      {statusMessage && <Text style={emailStyles.text}>{statusMessage}</Text>}

      <Text style={emailStyles.text}>
        <strong>Your Trip:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Reference:</strong> {tripNumber || bookingNumber}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Date &amp; Time:</strong> {pickupDateTime}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        If anything looks wrong, reply to this email and we will sort it out.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessCustomerBookingStatusUpdateEmail;
