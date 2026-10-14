import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import DriverCard from '../components/driver-card';
import SectionLabel from '../components/section-label';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

// The tel: href is built by DriverCard, which strips the number to digits and a leading +.

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
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
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
  bookedBy,
}: BusinessBookingDriverAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Driver assigned for #${tripNumber || bookingReference}`}
      heading="Driver Assigned"
      eyebrow="Driver assigned"
      tone="success"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="success">
        A driver has been assigned to booking{' '}
        <strong>#{tripNumber || bookingReference}</strong> for{' '}
        <strong>{passengerName}</strong>.
      </InfoBox>

      <SectionLabel>Assigned Driver</SectionLabel>
      <DriverCard name={driverName} phone={driverPhone || undefined} />

      <DetailsSection title="Booking Details">
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Passenger">{passengerName}</DetailRow>
        <DetailRow label="Pickup Date">{pickupDate}</DetailRow>
        <DetailRow label="Pickup Time">{pickupTime}</DetailRow>
      </DetailsSection>

      <Button href={bookingUrl}>View Booking</Button>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        Your passenger has also been sent these driver contact details.
        <br />
        <br />
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingDriverAssignedEmail;
