import { Hr, Link, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

/** Strips spaces, dashes and brackets so the tel: href is dialable. Keeps a leading +. */
const toDialableNumber = (phone: string): string => phone.replace(/[^\d+]/g, '');

interface BusinessBookingDriverAssignedEmailProps {
  businessName: string;
  passengerName: string;
  bookingReference: string;
  tripNumber?: string;
  driverName: string;
  driverPhone?: string | null;
  pickupDate: string;
  pickupTime: string;
  bookingUrl: string;
}

export const BusinessBookingDriverAssignedEmail = ({
  businessName,
  passengerName,
  bookingReference,
  tripNumber,
  driverName,
  driverPhone,
  pickupDate,
  pickupTime,
  bookingUrl,
}: BusinessBookingDriverAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Driver assigned for #${tripNumber || bookingReference}`}
      heading="Driver Assigned"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <InfoBox type="success">
        A driver has been assigned to booking{' '}
        <strong>#{tripNumber || bookingReference}</strong> for{' '}
        <strong>{passengerName}</strong>.
      </InfoBox>

      <InfoBox type="info" title="Assigned Driver">
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
        <strong>Booking Details:</strong>
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
          <strong>Passenger:</strong> {passengerName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date:</strong> {pickupDate}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Time:</strong> {pickupTime}
        </Text>
      </DetailsSection>

      <Button href={bookingUrl}>View Booking</Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        Your passenger has also been sent these driver contact details.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingDriverAssignedEmail;
