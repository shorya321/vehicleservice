import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingReference: string;
  vehicleCategory: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  totalAmount: number;
  currency: string;
}

export const BookingConfirmationEmail = ({
  customerName,
  bookingReference,
  vehicleCategory,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  totalAmount,
  currency,
}: BookingConfirmationEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Confirmed - ${bookingReference}`}
      heading="Booking Confirmation"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        Great news! Your booking has been confirmed. Here are your booking details:
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle Category:</strong> {vehicleCategory}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date & Time:</strong> {pickupDate} at {pickupTime}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Location:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Date & Time:</strong> {dropoffDate} at {dropoffTime}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.totalRow}>
          <strong>Total Amount:</strong> {currency} {totalAmount.toFixed(2)}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        We'll send you updates about your booking, including vendor assignment and any changes to
        your reservation.
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions or need to modify your booking, please contact our support team
        and provide your booking reference number.
      </Text>

      <Text style={emailStyles.text}>
        Thank you for choosing Vehicle Service!
        <br />
        <br />
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BookingConfirmationEmail;
