import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import { emailStyles } from '../../styles/constants';

interface BookingCancelledEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  refundDue: number | null;
  tripLabel?: string;
  groupNumber?: string;
  discountForfeited?: boolean;
}

/** Sent to the customer when they cancel a booking, or one journey of a trip. */
export const BookingCancelledEmail = ({
  customerName,
  bookingReference,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  refundDue,
  tripLabel,
  groupNumber,
  discountForfeited,
}: BookingCancelledEmailProps) => {
  const reference = tripNumber || bookingReference;
  return (
    <EmailLayout preview={`Booking cancelled - ${reference}`} heading="Booking Cancelled">
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {groupNumber
          ? `This journey of your trip ${groupNumber} is cancelled. The rest of your trip is unchanged.`
          : 'Your booking is cancelled.'}
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {reference}
        </Text>
        {tripLabel && (
          <Text style={emailStyles.detailRow}>
            <strong>Journey:</strong> {tripLabel}
          </Text>
        )}
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff Location:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Was due:</strong> {pickupDate} at {pickupTime}
        </Text>
        {refundDue !== null && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.totalRow}>
              <strong>Refund:</strong> AED {refundDue.toFixed(2)}
            </Text>
            {discountForfeited && (
              <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
                The round-trip saving no longer applies to the rest of your trip, so it is taken from this refund.
              </Text>
            )}
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        {refundDue !== null && refundDue > 0
          ? 'The refund goes back to the card you paid with. It usually appears within 5 to 10 working days.'
          : 'Nothing was charged for this booking, so there is nothing to refund.'}
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers
      </Text>
    </EmailLayout>
  );
};

export default BookingCancelledEmail;
