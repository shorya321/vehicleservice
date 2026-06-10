import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface BookingUnassignedEmailProps {
  vendorName: string;
  bookingReference: string;
  customerName: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  reassignmentReason?: string;
  bookingUrl: string;
}

export const BookingUnassignedEmail = ({
  vendorName,
  bookingReference,
  customerName,
  pickupLocation,
  pickupDate,
  pickupTime,
  reassignmentReason,
  bookingUrl,
}: BookingUnassignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Reassigned - ${bookingReference}`}
      heading="Booking Reassigned"
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="warning">
        Booking <strong>#{bookingReference}</strong> has been reassigned to another vendor.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Booking Details:</strong>
      </Text>

      <DetailsSection>
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

      {reassignmentReason && (
        <DetailsSection>
          <Text style={emailStyles.detailRow}>
            <strong>Reason:</strong> {reassignmentReason}
          </Text>
        </DetailsSection>
      )}

      <InfoBox type="info">
        You no longer need to take any action on this booking. If you had assigned a driver or
        vehicle, their schedules have been automatically freed up.
      </InfoBox>

      <Button href={bookingUrl}>View My Bookings</Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions, please contact our support team.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingUnassignedEmail;
