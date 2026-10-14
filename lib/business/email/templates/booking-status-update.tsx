import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import Journey from '../components/journey';
import SectionLabel from '../components/section-label';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

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
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
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
  bookedBy,
}: BusinessBookingStatusUpdateEmailProps) => {
  const infoType = statusInfoType[newStatus] || 'info';

  return (
    <EmailLayout
      preview={`Booking ${statusLabel(newStatus)} - ${tripNumber || bookingNumber}`}
      heading="Booking Status Update"
      eyebrow="Status update"
      tone={infoType}
      reference={{ label: 'Trip', value: tripNumber || bookingNumber }}
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type={infoType}>
        Booking <strong>#{tripNumber || bookingNumber}</strong> status changed from{' '}
        <strong>{statusLabel(previousStatus)}</strong> to{' '}
        <strong>{statusLabel(newStatus)}</strong>.
      </InfoBox>

      {statusMessage && (
        <Text style={emailStyles.text}>{statusMessage}</Text>
      )}

      <SectionLabel>Booking Details</SectionLabel>

      <Journey when={pickupDateTime} pickup={pickupLocation} dropoff={dropoffLocation} />

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        <DetailRow label="Customer">{customerName}</DetailRow>
      </DetailsSection>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingStatusUpdateEmail;
