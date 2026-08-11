import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../platform';

interface BusinessCustomerBookingCompletedEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
}

/**
 * The passenger's trip-complete note, sent from the business.
 *
 * The completion path sent nothing at all before this, so the last thing a passenger ever
 * heard about their trip was the confirmation from before it happened.
 *
 * Written as the business closing the loop with its own customer. No platform, no
 * operator, no internal status vocabulary.
 */
export const BusinessCustomerBookingCompletedEmail = ({
  customerName,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  dropoffLocation,
  pickupDateTime,
}: BusinessCustomerBookingCompletedEmailProps) => {
  return (
    <EmailLayout
      preview={`Thanks for travelling with ${businessName}`}
      heading="Your Trip Is Complete"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="success">
        Your trip <strong>#{tripNumber || bookingNumber}</strong> is complete. Thank you for
        travelling with {businessName}.
      </InfoBox>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Reference:</strong> {tripNumber || bookingNumber}
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

      <Text style={emailStyles.text}>
        If you left something behind or something was not right, reply to this email and we
        will help.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessCustomerBookingCompletedEmail;
