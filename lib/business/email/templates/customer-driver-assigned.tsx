import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import DriverCard from '../components/driver-card';
import SectionLabel from '../components/section-label';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

// The tel: href is built by DriverCard, which strips the number to digits and a leading +.

interface CustomerDriverAssignedEmailProps {
  customerName: string;
  bookingReference: string;
  tripNumber?: string;
  driverName: string;
  driverPhone?: string | null;
  pickupDate: string;
  pickupTime: string;
}

export const CustomerDriverAssignedEmail = ({
  customerName,
  bookingReference,
  tripNumber,
  driverName,
  driverPhone,
  pickupDate,
  pickupTime,
}: CustomerDriverAssignedEmailProps) => {
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
        A driver has been assigned to your transfer{' '}
        <strong>#{tripNumber || bookingReference}</strong>.
      </InfoBox>

      <SectionLabel>Your Driver</SectionLabel>
      <DriverCard name={driverName} phone={driverPhone || undefined} />

      <DetailsSection title="Pickup Details">
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Pickup Date">{pickupDate}</DetailRow>
        <DetailRow label="Pickup Time">{pickupTime}</DetailRow>
      </DetailsSection>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        You can contact your driver directly on the number above closer to your pickup time.
        <br />
        <br />
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default CustomerDriverAssignedEmail;
