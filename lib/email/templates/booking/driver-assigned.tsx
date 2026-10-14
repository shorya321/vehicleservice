import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import DriverCard from '../../components/driver-card';
import SectionLabel from '../../components/section-label';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

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
      eyebrow="Driver assigned"
      tone="success"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        A driver has been assigned to your booking{' '}
        <strong>#{tripNumber || bookingReference}</strong>.
      </InfoBox>

      <SectionLabel>Your Driver</SectionLabel>
      <DriverCard name={driverName} phone={driverPhone || undefined} />

      <DetailsSection title="Pickup Details">
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Pickup Date">{pickupDate}</DetailRow>
        <DetailRow label="Pickup Time">{pickupTime}</DetailRow>
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
