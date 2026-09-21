import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';

interface AdminBookingCancelledEmailProps {
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  refundDue: number | null;
  tripLabel?: string;
  groupNumber?: string;
  discountForfeited?: boolean;
  bookingDetailsUrl: string;
}

/** Tells the platform a customer cancelled, and what to refund by hand in Stripe. */
export const AdminBookingCancelledEmail = ({
  bookingReference,
  tripNumber,
  customerName,
  customerEmail,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  refundDue,
  tripLabel,
  groupNumber,
  discountForfeited,
  bookingDetailsUrl,
}: AdminBookingCancelledEmailProps) => {
  const reference = tripNumber || bookingReference;
  return (
    <EmailLayout preview={`Booking cancelled by customer - ${reference}`} heading="Booking Cancelled by Customer">
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        {refundDue !== null && refundDue > 0
          ? 'A customer cancelled a paid booking. Refunds are not automatic: please issue this one in Stripe.'
          : 'A customer cancelled a booking. Nothing was paid, so there is nothing to refund.'}
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {reference}
        </Text>
        {groupNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Part of trip:</strong> {groupNumber}
          </Text>
        )}
        {tripLabel && (
          <Text style={emailStyles.detailRow}>
            <strong>Journey:</strong> {tripLabel}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName} ({customerEmail})
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Route:</strong> {pickupLocation} to {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Was due:</strong> {pickupDate} at {pickupTime}
        </Text>
        {refundDue !== null && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.totalRow}>
              <strong>Refund due:</strong> AED {refundDue.toFixed(2)}
            </Text>
            {discountForfeited && (
              <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
                Net of the round-trip saving the remaining journey no longer qualifies for.
              </Text>
            )}
          </>
        )}
      </DetailsSection>

      <Button href={bookingDetailsUrl}>View Booking</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default AdminBookingCancelledEmail;
