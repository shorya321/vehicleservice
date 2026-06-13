import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface DriverBookingUnassignedEmailProps {
  driverName: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reason?: string;
  vendorName: string;
}

export const DriverBookingUnassignedEmail = ({
  driverName,
  bookingReference,
  tripNumber,
  customerName,
  pickupLocation,
  pickupDate,
  pickupTime,
  reason,
  vendorName,
}: DriverBookingUnassignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Trip Removed - ${tripNumber || bookingReference}`}
      heading="Trip Removed"
    >
      <Text style={emailStyles.text}>Hi {driverName},</Text>

      <InfoBox type="warning">
        You have been removed from trip <strong>#{tripNumber || bookingReference}</strong>.
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
          <strong>Booking #:</strong> {bookingReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Time:</strong> {pickupTime}
        </Text>
      </DetailsSection>

      {reason && (
        <DetailsSection>
          <Text style={emailStyles.detailRow}>
            <strong>Reason:</strong> {reason}
          </Text>
        </DetailsSection>
      )}

      <InfoBox type="info">
        You no longer need to be available for this trip. Your schedule has been updated
        accordingly.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions, please contact {vendorName} directly.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default DriverBookingUnassignedEmail;
