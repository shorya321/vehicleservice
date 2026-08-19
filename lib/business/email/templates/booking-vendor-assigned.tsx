import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface BusinessVendorAssignedEmailProps {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  bookingUrl: string;
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
}

/**
 * Tells the business that one of its bookings now has a transport partner behind it.
 *
 * Owner-facing only. The passenger is deliberately not told, because which supplier
 * fulfils the trip is not something they asked about and not something the business
 * necessarily wants surfaced.
 *
 * The partner is not named. The business's relationship is with the platform, and putting
 * a supplier's identity in front of them invites both parties to route around it. If the
 * business needs the operator's details they are on the booking page, behind a login.
 */
export const BusinessVendorAssignedEmail = ({
  businessName,
  bookingNumber,
  tripNumber,
  customerName,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
  bookingUrl,
  bookedBy,
}: BusinessVendorAssignedEmailProps) => {
  return (
    <EmailLayout
      preview={`Transport arranged - ${tripNumber || bookingNumber}`}
      heading="Transport Arranged"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="success">
        Booking <strong>#{tripNumber || bookingNumber}</strong> has been assigned to a
        transport partner. A driver and vehicle will be confirmed closer to the pickup time.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Booking Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {tripNumber || bookingNumber}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Passenger:</strong> {customerName}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Date &amp; Time:</strong> {pickupDateTime}
        </Text>
      </DetailsSection>

      <Button href={bookingUrl}>View Booking</Button>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessVendorAssignedEmail;
