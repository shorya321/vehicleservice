import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface BookingAssignedEmailProps {
  vendorName: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  bookingUrl: string;
}

export const BookingAssignedEmail = ({
  vendorName,
  bookingReference,
  tripNumber,
  customerName,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  bookingUrl,
}: BookingAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`New Booking Assignment - ${tripNumber || bookingReference}`}
      heading="New Booking Assigned"
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="success">
        A new booking <strong>#{tripNumber || bookingReference}</strong> has been assigned to your company.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Booking Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {tripNumber || bookingReference}
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

      <Button href={bookingUrl}>View My Bookings</Button>

      <InfoBox type="info" title="Action Required">
        Please review this booking and ensure you have a driver and vehicle available for the
        scheduled pickup. Accept the assignment from your vendor dashboard.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions about this booking, please contact our support team.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingAssignedEmail;
