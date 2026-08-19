import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface BusinessVendorRejectedEmailProps {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  pickupDateTime: string;
  bookingUrl: string;
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
}

/**
 * Tells the business that a booking lost its transport partner and is being reassigned.
 *
 * Owner-facing only, and firmly so: the passenger must not learn that their trip briefly
 * had no operator. Nothing has changed from their point of view, and telling them
 * manufactures a worry that the reassignment is about to resolve.
 *
 * This exists because the vendor rejection path sent nothing at all, which left the
 * business holding an unassigned booking with no signal that anything needed attention.
 */
export const BusinessVendorRejectedEmail = ({
  businessName,
  bookingNumber,
  tripNumber,
  customerName,
  pickupLocation,
  pickupDateTime,
  bookingUrl,
  bookedBy,
}: BusinessVendorRejectedEmailProps) => {
  return (
    <EmailLayout
      preview={`Reassigning transport - ${tripNumber || bookingNumber}`}
      heading="Arranging New Transport"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="warning" title="This booking is being reassigned">
        The transport partner for booking <strong>#{tripNumber || bookingNumber}</strong> is
        no longer able to cover it, so we are arranging a replacement. You will be emailed
        again once new transport is confirmed.
      </InfoBox>

      <Text style={emailStyles.text}>
        Your passenger has not been contacted about this and does not need to be. The trip
        details are unchanged.
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

export default BusinessVendorRejectedEmail;
