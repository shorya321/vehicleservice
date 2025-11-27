import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface BusinessBookingCancelledEmailProps {
  businessName: string;
  bookingNumber: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
  refundAmount: number;
  newBalance: number;
  currency: string;
  walletUrl: string;
}

export const BusinessBookingCancelledEmail = ({
  businessName,
  bookingNumber,
  customerName,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  cancellationReason,
  refundAmount,
  newBalance,
  currency,
  walletUrl,
}: BusinessBookingCancelledEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${bookingNumber}`}
      heading="Booking Cancelled"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="warning">
        Booking <strong>#{bookingNumber}</strong> has been cancelled.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Cancelled Booking Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Date & Time:</strong> {pickupDateTime}
        </Text>
        {cancellationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Reason:</strong> {cancellationReason}
            </Text>
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Refund Summary:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Refund Amount:</strong> {currency} {refundAmount.toFixed(2)}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.totalRow}>
          <strong>New Wallet Balance:</strong> {currency} {newBalance.toFixed(2)}
        </Text>
      </DetailsSection>

      <InfoBox type="success">
        The refund has been automatically credited back to your wallet.
      </InfoBox>

      <Button href={walletUrl}>View Wallet Balance</Button>

      <Text style={emailStyles.text}>
        If you have any questions about this cancellation, please contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingCancelledEmail;
