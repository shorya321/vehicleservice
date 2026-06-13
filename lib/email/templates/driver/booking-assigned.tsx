import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface DriverBookingAssignedEmailProps {
  driverName: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
}

export const DriverBookingAssignedEmail = ({
  driverName,
  bookingReference,
  tripNumber,
  customerName,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  vendorName,
}: DriverBookingAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Trip Assignment - ${tripNumber || bookingReference}`}
      heading="Trip Assigned to You"
    >
      <Text style={emailStyles.text}>Hi {driverName},</Text>

      <InfoBox type="success">
        You have been assigned to trip <strong>#{tripNumber || bookingReference}</strong> by{' '}
        <strong>{vendorName}</strong>.
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
          <strong>Vehicle Category:</strong> {vehicleCategory}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle Type:</strong> {vehicleType}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Location:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Time:</strong> {pickupTime}
        </Text>
      </DetailsSection>

      <InfoBox type="info" title="Action Required">
        Please ensure you are available for the scheduled pickup time. Contact your dispatch
        manager if you have any questions or conflicts.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions about this trip, please contact your vendor directly.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default DriverBookingAssignedEmail;
