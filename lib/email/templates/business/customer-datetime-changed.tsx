import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';

interface CustomerDatetimeChangedEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  previousDateTime: string;
  newDateTime: string;
  modificationReason?: string;
}

export const CustomerDatetimeChangedEmail = ({
  customerName,
  businessName,
  bookingNumber,
  tripNumber,
  pickupLocation,
  previousDateTime,
  newDateTime,
  modificationReason,
}: CustomerDatetimeChangedEmailProps) => {
  return (
    <EmailLayout
      preview={`Pickup Time Changed - ${tripNumber || bookingNumber}`}
      heading="Your Pickup Time Has Changed"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="warning">
        The pickup time for your booking <strong>#{tripNumber || bookingNumber}</strong> has
        been updated by <strong>{businessName}</strong>.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Updated Schedule:</strong>
      </Text>

      <DetailsSection>
        {tripNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Trip #:</strong> {tripNumber}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Booking #:</strong> {bookingNumber}
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

      <Text style={emailStyles.text}>
        Please ensure you are ready at the pickup location at the updated time.
      </Text>

      <Text style={emailStyles.text}>
        If you have any questions, please contact <strong>{businessName}</strong> or our
        support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default CustomerDatetimeChangedEmail;
