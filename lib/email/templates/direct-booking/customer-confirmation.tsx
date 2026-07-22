import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import InfoBox from '../../components/info-box';
import { emailStyles, statusColors } from '../../styles/constants';

/**
 * Confirmation for a booking a vendor recorded offline.
 *
 * Written in the vendor's voice: the customer dealt with the vendor directly and
 * has no platform account, no login, and no link to follow — so every fact they
 * need is inline.
 *
 * Deliberately has no prop for the vendor's internal notes or cancellation
 * reason. Both are vendor-private.
 */
interface DirectBookingCustomerConfirmationEmailProps {
  customerName: string;
  bookingReference: string;
  statusLabel: string;
  vehicleLabel: string;
  vehicleRegistration: string;
  driverName: string;
  driverPhone?: string;
  pickupLocation: string;
  dropoffLocation?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  paymentStatusLabel: string;
  paymentMethodLabel?: string;
  customerNotes?: string;
  vendorName: string;
  vendorPhone?: string;
}

const getStatusColor = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('confirmed')) return statusColors.confirmed;
  if (statusLower.includes('completed')) return statusColors.completed;
  if (statusLower.includes('cancelled')) return statusColors.cancelled;
  if (statusLower.includes('progress')) return statusColors.progress;
  return statusColors.pending;
};

export const DirectBookingCustomerConfirmationEmail = ({
  customerName,
  bookingReference,
  statusLabel,
  vehicleLabel,
  vehicleRegistration,
  driverName,
  driverPhone,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  totalAmount,
  amountPaid,
  balanceDue,
  currency,
  paymentStatusLabel,
  paymentMethodLabel,
  customerNotes,
  vendorName,
  vendorPhone,
}: DirectBookingCustomerConfirmationEmailProps) => {
  return (
    <EmailLayout
      preview={`Booking Confirmed - ${bookingReference}`}
      heading="Your Booking"
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {vendorName} has recorded your booking. Here are the details — please keep this
        email for your records.
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Booking Reference:</strong> {bookingReference}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Status:</strong>{' '}
          <span style={{ color: getStatusColor(statusLabel), fontWeight: 'bold' }}>
            {statusLabel}
          </span>
        </Text>

        <Hr style={emailStyles.hr} />

        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleLabel}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Registration:</strong> {vehicleRegistration}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Driver:</strong> {driverName}
        </Text>
        {driverPhone && (
          <Text style={emailStyles.detailRow}>
            <strong>Driver Phone:</strong> {driverPhone}
          </Text>
        )}

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

        <Hr style={emailStyles.hr} />

        <Text style={emailStyles.detailRow}>
          <strong>Total:</strong> {currency} {totalAmount.toFixed(2)}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Paid:</strong> {currency} {amountPaid.toFixed(2)} ({paymentStatusLabel})
        </Text>
        {balanceDue > 0 && (
          <Text style={emailStyles.totalRow}>
            <strong>Balance Due:</strong> {currency} {balanceDue.toFixed(2)}
          </Text>
        )}
        {paymentMethodLabel && (
          <Text style={emailStyles.detailRow}>
            <strong>Payment Method:</strong> {paymentMethodLabel}
          </Text>
        )}
      </DetailsSection>

      {customerNotes && (
        <InfoBox type="message" title="Your Notes">
          {customerNotes}
        </InfoBox>
      )}

      <Hr style={emailStyles.hr} />

      <Text style={emailStyles.text}>
        Questions or changes? Contact {vendorName}
        {vendorPhone ? ` on ${vendorPhone}` : ''} and quote your booking reference.
        <br />
        <br />
        Best regards,
        <br />
        {vendorName}
      </Text>
    </EmailLayout>
  );
};

export default DirectBookingCustomerConfirmationEmail;
