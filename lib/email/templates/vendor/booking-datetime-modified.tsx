import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import Button from '../base/button';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles } from '../../styles/constants';
import { format, parseISO } from 'date-fns';

interface BookingDatetimeModifiedEmailProps {
  vendorName: string;
  bookingNumber: string;
  customerName: string;
  pickupAddress: string;
  previousDatetime: string;
  newDatetime: string;
  modificationReason?: string;
  bookingUrl: string;
}

function formatDatetime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return isoString;
  }
}

export const BookingDatetimeModifiedEmail = ({
  vendorName,
  bookingNumber,
  customerName,
  pickupAddress,
  previousDatetime,
  newDatetime,
  modificationReason,
  bookingUrl,
}: BookingDatetimeModifiedEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Time Changed - ${bookingNumber}`}
      heading="Booking Time Updated"
    >
      <Text style={emailStyles.text}>Hi {vendorName},</Text>

      <InfoBox type="warning">
        The pickup time for booking <strong>#{bookingNumber}</strong> has been changed by the
        business.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Time Change Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Previous Time:</strong>{' '}
          <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>
            {formatDatetime(previousDatetime)}
          </span>
        </Text>
        <Text style={{ ...emailStyles.detailRow, color: '#059669', fontWeight: 600 }}>
          <strong>New Time:</strong> {formatDatetime(newDatetime)}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Booking Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking #:</strong> {bookingNumber}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Customer:</strong> {customerName}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup Location:</strong> {pickupAddress}
        </Text>
      </DetailsSection>

      {modificationReason && (
        <>
          <Text style={emailStyles.text}>
            <strong>Reason for Change:</strong>
          </Text>
          <DetailsSection>
            <Text style={emailStyles.detailRow}>{modificationReason}</Text>
          </DetailsSection>
        </>
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
        The Vehicle Service Team
      </Text>
    </EmailLayout>
  );
};

export default BookingDatetimeModifiedEmail;
