import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface NewBookingNotificationEmailProps {
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  vehicleCategory: string;
  vehicleType?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  currency: string;
  bookingDetailsUrl: string;
}

export const NewBookingNotificationEmail = ({
  bookingReference,
  tripNumber,
  customerName,
  customerEmail,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  totalAmount,
  currency,
  bookingDetailsUrl,
}: NewBookingNotificationEmailProps) => {
  return (
    <EmailLayout
      preview={`New Booking Received - ${bookingReference}`}
      heading="New Booking Received"
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new booking has been received and payment confirmed. Here are the details:
      </Text>

      <DetailsSection>
        {tripNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Trip #:</strong> {tripNumber}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Customer Name:</strong> {customerName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Customer Email:</strong> {customerEmail}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle Category:</strong> {vehicleCategory}
        </Text>
        {vehicleType && (
          <Text style={emailStyles.detailRow}>
            <strong>Vehicle Type:</strong> {vehicleType}
          </Text>
        )}
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Location:</strong> {dropoffLocation}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Time:</strong> {pickupTime}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.totalRow}>
          <strong>Total Amount:</strong> {currency} {totalAmount.toFixed(2)}
        </Text>
      </DetailsSection>

      <Button href={bookingDetailsUrl}>View Booking Details</Button>

      <Text style={emailStyles.text}>
        This is an automated notification. Please review and assign a vendor to this booking.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default NewBookingNotificationEmail;
