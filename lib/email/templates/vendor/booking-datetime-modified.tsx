import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import InfoBox from '../../components/info-box';
import { boxStyles, emailStyles, palette } from '../../styles/constants';
import { format } from 'date-fns';
import { toBookingTz } from '@/lib/utils/timezone';

interface BookingDatetimeModifiedEmailProps {
  vendorName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupAddress: string;
  previousDatetime: string;
  newDatetime: string;
  modificationReason?: string;
  bookingUrl: string;
}

function formatDatetime(isoString: string): string {
  try {
    return format(toBookingTz(isoString), "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return isoString;
  }
}

export const BookingDatetimeModifiedEmail = ({
  vendorName,
  bookingNumber,
  tripNumber,
  customerName,
  pickupAddress,
  previousDatetime,
  newDatetime,
  modificationReason,
  bookingUrl,
}: BookingDatetimeModifiedEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Time Changed - ${tripNumber || bookingNumber}`}
      heading="Booking Time Updated"
      eyebrow="Time changed"
      tone="warning"
      reference={{ label: 'Trip', value: tripNumber || bookingNumber }}
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="warning">
        <Text style={boxStyles.warning.text}>
          The pickup time for booking <strong>#{tripNumber || bookingNumber}</strong> has been changed by the
          business.
        </Text>
      </InfoBox>

      <DetailsSection title="Time Change Details">
        <DetailRow label="Previous Time">
          <span style={{ textDecoration: 'line-through', color: palette.muted }}>
            {formatDatetime(previousDatetime)}
          </span>
        </DetailRow>
        <DetailRow label="New Time" emphasis>
          <span style={{ color: '#059669' }}>{formatDatetime(newDatetime)}</span>
        </DetailRow>
      </DetailsSection>

      <DetailsSection title="Booking Details">
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        <DetailRow label="Customer">{customerName}</DetailRow>
        <DetailRow label="Pickup Location">{pickupAddress}</DetailRow>
      </DetailsSection>

      {modificationReason && (
        <DetailsSection title="Reason for Change">
          <Text style={emailStyles.detailRow}>{modificationReason}</Text>
        </DetailsSection>
      )}

      <Button href={bookingUrl}>View Booking Details</Button>

      <InfoBox type="info" title="Action Required">
        Please update your schedule accordingly and ensure the assigned driver is informed of the
        new pickup time.
      </InfoBox>

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        If you have any questions or concerns about this change, please contact the business
        directly or reach out to our support team.
        <br />
        <br />
        Best regards,
        <br />
        The Infinia Transfers Team
      </Text>
    </EmailLayout>
  );
};

export default BookingDatetimeModifiedEmail;
