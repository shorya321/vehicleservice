import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface BusinessBookingConfirmationEmailProps {
  businessName: string;
  bookingNumber: string;
  customerName: string;
  customerPhone?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  passengerCount: number;
  totalPrice: number;
  currency: string;
  walletDeducted: number;
  newBalance: number;
  bookingUrl: string;
  referenceNumber?: string;
}

export const BusinessBookingConfirmationEmail = ({
  businessName,
  bookingNumber,
  customerName,
  customerPhone,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  vehicleType,
  passengerCount,
  totalPrice,
  currency,
  walletDeducted,
  newBalance,
  bookingUrl,
  referenceNumber,
}: BusinessBookingConfirmationEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Created - ${bookingNumber}`}
      heading="Booking Confirmation"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="success">
        Your booking <strong>#{bookingNumber}</strong> has been created successfully!
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Customer Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Customer Name:</strong> {customerName}
        </Text>
        {customerPhone && (
          <Text style={emailStyles.detailRow}>
            <strong>Phone:</strong> {customerPhone}
          </Text>
        )}
        {referenceNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Reference #:</strong> {referenceNumber}
          </Text>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Trip Details:</strong>
      </Text>

      <DetailsSection>
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
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Payment Summary:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Total:</strong> {currency} {totalPrice.toFixed(2)}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Deducted from Wallet:</strong> {currency} {walletDeducted.toFixed(2)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.totalRow}>
          <strong>New Wallet Balance:</strong> {currency} {newBalance.toFixed(2)}
        </Text>
      </DetailsSection>

      <Button href={bookingUrl}>View Booking Details</Button>

      <InfoBox type="info" title="What's Next?">
        Our team will assign a vendor to your booking. You'll receive a notification once a driver
        has been assigned.
      </InfoBox>

      <Text style={emailStyles.text}>
        Thank you for using Vehicle Service!
        <br />
        <br />
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingConfirmationEmail;
