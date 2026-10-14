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

interface BookingAssignedEmailProps {
  vendorName: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  bookingUrl: string;
  tripLabel?: string;
}

export const BookingAssignedEmail = ({
  vendorName,
  bookingReference,
  tripNumber,
  customerName,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  bookingUrl,
  tripLabel,
}: BookingAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`New Booking Assignment - ${tripNumber || bookingReference}`}
      heading="New Booking Assigned"
      eyebrow="Booking assigned"
      tone="success"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="success">
        <Text style={boxStyles.success.text}>
          A new booking <strong>#{tripNumber || bookingReference}</strong> has been assigned to your company.
        </Text>
      </InfoBox>

      <SectionLabel>Job</SectionLabel>
      <Journey
        time={pickupTime}
        date={pickupDate}
        pickup={pickupLocation}
        dropoff={dropoffLocation}
      />

      <DetailsSection title="Booking Details">
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Customer">{customerName}</DetailRow>
        <DetailRow label="Vehicle Category">{vehicleCategory}</DetailRow>
        <DetailRow label="Vehicle Type">{vehicleType}</DetailRow>
        {tripLabel && <DetailRow label="Service">{tripLabel}</DetailRow>}
      </DetailsSection>

      <Button href={bookingUrl}>View My Bookings</Button>

      <InfoBox type="info" title="Action Required">
        Please review this booking and ensure you have a driver and vehicle available for the
        scheduled pickup. Accept the assignment from your vendor dashboard.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions about this booking, please contact our support team.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingAssignedEmail;
