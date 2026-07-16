import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { formatGuestSummary } from '@/lib/business/guest-breakdown';

interface CustomerBookingConfirmationEmailProps {
  customerName: string;
  customerPhone?: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  /** Seated guests (adults + children). Infants ride on a lap. */
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  referenceNumber?: string;
  extras?: Array<{ label: string; quantity: number; price: number }>;
}

export const CustomerBookingConfirmationEmail = ({
  customerName,
  customerPhone,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  vehicleType,
  passengerCount,
  adults,
  children,
  infants,
  referenceNumber,
  extras,
}: CustomerBookingConfirmationEmailProps) => {
  // Older bookings predate the guest breakdown — fall back to the seated count.
  const passengerLabel =
    adults != null
      ? formatGuestSummary({ adults, children: children ?? 0, infants: infants ?? 0 })
      : passengerCount;

  return (
    <EmailLayout
      preview={`Your Transfer Booking - ${tripNumber || bookingNumber}`}
      heading="Your Transfer Has Been Booked"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        Your transfer has been booked by <strong>{businessName}</strong>.
        Your trip number is <strong>#{tripNumber || bookingNumber}</strong>
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Trip Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {tripNumber || bookingNumber}
        </Text>
        {referenceNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Reference #:</strong> {referenceNumber}
          </Text>
        )}
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Date & Time:</strong> {pickupDateTime}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleType}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Passengers:</strong> {passengerLabel}
        </Text>
        {customerPhone && (
          <Text style={emailStyles.detailRow}>
            <strong>Contact:</strong> {customerPhone}
          </Text>
        )}
        {extras && extras.length > 0 && (
          <>
            <Hr style={emailStyles.hr} />
            {extras.map((extra, index) => (
              <Text key={index} style={emailStyles.detailRow}>
                <strong>Extra:</strong> {extra.label}
                {extra.quantity > 1 ? ` x${extra.quantity}` : ''}
              </Text>
            ))}
          </>
        )}
      </DetailsSection>

      <InfoBox type="info" title="What to Expect">
        A driver will be assigned to your transfer. Please be ready at the pickup
        location at the scheduled time.
      </InfoBox>

      <Text style={emailStyles.text}>
        If you have any questions about your transfer, please contact{' '}
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

export default CustomerBookingConfirmationEmail;
