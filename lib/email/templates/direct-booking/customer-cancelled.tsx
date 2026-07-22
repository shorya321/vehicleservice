import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

/**
 * Tells the customer their offline booking was cancelled.
 *
 * Carries no reason on purpose: `cancellation_reason` is the vendor's own record,
 * written in the third person about the customer ("Customer cancelled",
 * "no-show"), and echoing it back would disclose an internal judgement. The
 * customer is pointed at the vendor instead.
 */
interface DirectBookingCustomerCancelledEmailProps {
  customerName: string;
  bookingReference: string;
  vehicleLabel: string;
  pickupDate: string;
  pickupTime: string;
  vendorName: string;
  vendorPhone?: string;
}

export const DirectBookingCustomerCancelledEmail = ({
  customerName,
  bookingReference,
  vehicleLabel,
  pickupDate,
  pickupTime,
  vendorName,
  vendorPhone,
}: DirectBookingCustomerCancelledEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${bookingReference}`}
      heading="Booking Cancelled"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="warning" title="This booking has been cancelled">
        {vendorName} has cancelled the booking below. No vehicle or driver is held for
        you any longer.
      </InfoBox>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleLabel}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Original Pickup:</strong> {pickupDate} at {pickupTime}
        </Text>
      </DetailsSection>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If this is unexpected, or you would like to rebook, contact {vendorName}
        {vendorPhone ? ` on ${vendorPhone}` : ''} and quote your booking reference. Any
        refund due is handled directly by {vendorName}.
        <br />
        <br />
        Best regards,
        <br />
        {vendorName}
      </Text>
    </EmailLayout>
  );
};

export default DirectBookingCustomerCancelledEmail;
