import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import { boxStyles, emailStyles } from '../../styles/constants';

interface BookingUnassignedEmailProps {
  vendorName: string;
  bookingReference: string;
  tripNumber?: string;
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
  tripNumber,
  customerName,
  pickupLocation,
  pickupDate,
  pickupTime,
  reassignmentReason,
  bookingUrl,
}: BookingUnassignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Reassigned - ${tripNumber || bookingReference}`}
      heading="Booking Reassigned"
      eyebrow="Booking reassigned"
      tone="danger"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="warning">
        <Text style={boxStyles.warning.text}>
          Booking <strong>#{tripNumber || bookingReference}</strong> has been reassigned to another vendor.
        </Text>
      </InfoBox>

      <SectionLabel>Job</SectionLabel>
      <Journey time={pickupTime} date={pickupDate} pickup={pickupLocation} />

      <DetailsSection title="Booking Details">
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Customer">{customerName}</DetailRow>
        {reassignmentReason && <DetailRow label="Reason">{reassignmentReason}</DetailRow>}
      </DetailsSection>

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
