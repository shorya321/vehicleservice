import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

interface CustomerDatetimeChangedEmailProps {
  customerName: string;
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  pickupLocation: string;
  previousDateTime: string;
  newDateTime: string;
  modificationReason?: string;
  /** "Round trip BG-..., return journey" when this booking is one journey of a trip. */
  tripContext?: string;
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
  tripContext,
}: CustomerDatetimeChangedEmailProps) => {
  return (
    <EmailLayout
      preview={`Pickup Time Changed - ${tripNumber || bookingNumber}`}
      heading="Your Pickup Time Has Changed"
      eyebrow="Time changed"
      tone="warning"
      reference={{ label: 'Trip', value: tripNumber || bookingNumber }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <InfoBox type="warning">
        The pickup time for your booking <strong>#{tripNumber || bookingNumber}</strong> has
        been updated by <strong>{businessName}</strong>.
      </InfoBox>

      <DetailsSection title="Updated Schedule">
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        {tripContext && <DetailRow label="Part of">{tripContext}</DetailRow>}
        <Hr style={emailStyles.hr} />
        <DetailRow label="Previous Time">
          <span style={{ textDecoration: 'line-through' }}>{previousDateTime}</span>
        </DetailRow>
        <DetailRow label="New Time" emphasis>
          {newDateTime}
        </DetailRow>
        <Hr style={emailStyles.hr} />
        <DetailRow label="Pickup">{pickupLocation}</DetailRow>
        {modificationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <DetailRow label="Reason">{modificationReason}</DetailRow>
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
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default CustomerDatetimeChangedEmail;
