import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

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
  passengerCount: number;
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
  referenceNumber,
  extras,
}: CustomerBookingConfirmationEmailProps) => {
  return (
    <EmailLayout
      preview={`Your Transfer Booking - ${tripNumber || bookingNumber}`}
      heading="Your Transfer Has Been Booked"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        Your transfer has been booked by <strong>{businessName}</strong>.
        Booking reference: <strong>#{tripNumber || bookingNumber}</strong>
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Trip Details:</strong>
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
          <strong>Passengers:</strong> {passengerCount}
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
