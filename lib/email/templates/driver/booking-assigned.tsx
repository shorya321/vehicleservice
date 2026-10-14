import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface DriverBookingAssignedEmailProps {
  driverName: string;
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  vehicleCategory: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
  tripLabel?: string;
}

export const DriverBookingAssignedEmail = ({
  driverName,
  bookingReference,
  tripNumber,
  customerName,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  vendorName,
  tripLabel,
}: DriverBookingAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Trip Assignment - ${tripNumber || bookingReference}`}
      heading="Trip Assigned to You"
      eyebrow="Trip assigned"
      tone="success"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {driverName},</Text>

      <InfoBox type="success">
        You have been assigned to trip <strong>#{tripNumber || bookingReference}</strong> by{' '}
        <strong>{vendorName}</strong>.
      </InfoBox>

      <SectionLabel>Trip Details</SectionLabel>
      <Journey
        time={pickupTime}
        date={pickupDate}
        pickup={pickupLocation}
        dropoff={dropoffLocation}
      />

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <DetailRow label="Customer">{customerName}</DetailRow>
        <DetailRow label="Vehicle Category">{vehicleCategory}</DetailRow>
        <DetailRow label="Vehicle Type">{vehicleType}</DetailRow>
        {tripLabel && <DetailRow label="Service">{tripLabel}</DetailRow>}
      </DetailsSection>

      <InfoBox type="info" title="Action Required">
        Please ensure you are available for the scheduled pickup time. Contact your dispatch
        manager if you have any questions or conflicts.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions about this trip, please contact your vendor directly.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default DriverBookingAssignedEmail;
