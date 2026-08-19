import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface BusinessBookingDatetimeChangedEmailProps {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  previousDateTime: string;
  newDateTime: string;
  modificationReason?: string;
  bookingUrl: string;
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
}

/**
 * Tells the business side that one of its bookings moved.
 *
 * Rescheduling used to notify the vendor and the passenger and say nothing to the business
 * at all, so the account that owns the booking - and the staff member who has to answer
 * the guest's next phone call - could be the last to know their own trip had changed time.
 *
 * A new template rather than a reuse of ./customer-datetime-changed.tsx. That one is
 * written in the tenant's voice to the passenger ("Hi {customerName}", "contact
 * {businessName}"), so sending it to the business would greet them as their own guest and
 * point them at themselves for support - the same mix-up ../services/business-emails.ts
 * documents where the two audiences were previously crossed.
 *
 * Carries no money, so unlike ./booking-confirmation.tsx it needs no owner/creator split:
 * the owner and the staff member who created the booking both want exactly this.
 */
export const BusinessBookingDatetimeChangedEmail = ({
  businessName,
  bookingNumber,
  tripNumber,
  customerName,
  pickupLocation,
  previousDateTime,
  newDateTime,
  modificationReason,
  bookingUrl,
  bookedBy,
}: BusinessBookingDatetimeChangedEmailProps) => {
  return (
    <EmailLayout
      preview={`Pickup Time Changed - ${tripNumber || bookingNumber}`}
      heading="Pickup Time Changed"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="warning">
        The pickup time for booking <strong>#{tripNumber || bookingNumber}</strong> has been
        updated.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Updated Schedule:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {tripNumber || bookingNumber}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Previous Time:</strong> {previousDateTime}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>New Time:</strong> {newDateTime}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        {modificationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Reason:</strong> {modificationReason}
            </Text>
          </>
        )}
      </DetailsSection>

      <Button href={bookingUrl}>View Booking Details</Button>

      <InfoBox type="info">
        The passenger has been told about the new time, and the transport partner has been
        notified.
      </InfoBox>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingDatetimeChangedEmail;
