import { Hr, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

/** Strips spaces, dashes and brackets so the tel: href is dialable. Keeps a leading +. */
const toDialableNumber = (phone: string): string => phone.replace(/[^\d+]/g, '');

interface BookingDriverAssignedEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  driverName: string;
  driverPhone?: string | null;
  pickupDate: string;
  pickupTime: string;
  accountUrl: string;
}

export const BookingDriverAssignedEmail = ({
  customerName,
  bookingReference,
  tripNumber,
  driverName,
  driverPhone,
  pickupDate,
  pickupTime,
  accountUrl,
}: BookingDriverAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Your driver for #${tripNumber || bookingReference} has been assigned`}
      heading="Your Driver Has Been Assigned"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        A driver has been assigned to your booking{' '}
        <strong>#{tripNumber || bookingReference}</strong>.
      </InfoBox>

      <InfoBox type="info" title="Your Driver">
        <Text style={emailStyles.detailRow}>
          <strong>Name:</strong> {driverName}
        </Text>
        {driverPhone && (
          <Text style={emailStyles.detailRow}>
            <strong>Phone:</strong>{' '}
            <Link href={`tel:${toDialableNumber(driverPhone)}`} style={emailStyles.link}>
              {driverPhone}
            </Link>
          </Text>
        )}
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Pickup Details:</strong>
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
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Time:</strong> {pickupTime}
        </Text>
      </DetailsSection>

      <Button href={accountUrl}>View Your Booking</Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        You can contact your driver directly on the number above closer to your pickup time.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingDriverAssignedEmail;
