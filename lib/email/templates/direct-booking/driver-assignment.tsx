import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

/**
 * Tells a driver they have been given an offline job.
 *
 * Assignment is unilateral in this module — there is no accept step and no
 * driver portal — so this email is the driver's only notice.
 *
 * Deliberately carries neither the customer's phone number nor any pricing. The
 * passenger's contact details stay with the vendor, and what the customer paid
 * is the vendor's business — the driver is pointed at the vendor for both.
 */
interface DirectBookingDriverAssignmentEmailProps {
  driverName: string;
  bookingReference: string;
  customerName: string;
  vehicleLabel: string;
  vehicleRegistration: string;
  pickupLocation: string;
  dropoffLocation?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  vendorName: string;
  vendorPhone?: string;
}

export const DirectBookingDriverAssignmentEmail = ({
  driverName,
  bookingReference,
  customerName,
  vehicleLabel,
  vehicleRegistration,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  vendorName,
  vendorPhone,
}: DirectBookingDriverAssignmentEmailProps) => {
  return (
    <EmailLayout
      preview={`Trip Assignment - ${bookingReference}`}
      heading="Trip Assigned to You"
    >
      <Text style={emailStyles.text}>Hi {driverName},</Text>

      <InfoBox type="success">
        <strong>{vendorName}</strong> has assigned you to booking{' '}
        <strong>#{bookingReference}</strong>.
      </InfoBox>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>

        <Hr style={emailStyles.hr} />

        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>

        <Hr style={emailStyles.hr} />

        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleLabel}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Registration:</strong> {vehicleRegistration}
        </Text>

        <Hr style={emailStyles.hr} />

        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Date &amp; Time:</strong> {pickupDate} at {pickupTime}
        </Text>
        {dropoffLocation && (
          <Text style={emailStyles.detailRow}>
            <strong>Drop-off:</strong> {dropoffLocation}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Return Date &amp; Time:</strong> {returnDate} at {returnTime}
        </Text>
      </DetailsSection>

      <InfoBox type="info" title="Action Required">
        Please confirm you are available for this pickup. If you have a conflict, tell{' '}
        {vendorName} as soon as possible so the job can be reassigned.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        Questions about this trip? Contact {vendorName}
        {vendorPhone ? ` on ${vendorPhone}` : ''}.
        <br />
        <br />
        Best regards,
        <br />
        {vendorName}
      </Text>
    </EmailLayout>
  );
};

export default DirectBookingDriverAssignmentEmail;
