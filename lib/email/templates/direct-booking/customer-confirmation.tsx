import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import DetailRow from '../../components/detail-row';
import DriverCard from '../../components/driver-card';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import InfoBox from '../../components/info-box';
import { emailStyles, statusColors } from '../../styles/constants';

/**
 * Confirmation for a booking a vendor recorded offline.
 *
 * Written in the vendor's voice: the customer dealt with the vendor directly and
 * has no platform account, no login, and no link to follow, so every fact they
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
      eyebrow="Booking confirmed"
      tone="success"
      reference={{ label: 'Booking', value: bookingReference }}
    >
      <Text style={emailStyles.text}>Hi {customerName},</Text>

      <Text style={emailStyles.text}>
        {vendorName} has recorded your booking. Here are the details. Please keep this
        email for your records.
      </Text>

      <SectionLabel>Your journey</SectionLabel>
      <Journey
        time={pickupTime}
        date={pickupDate}
        pickup={pickupLocation}
        dropoff={dropoffLocation || undefined}
      >
        <DetailRow label="Return Date & Time">
          {returnDate} at {returnTime}
        </DetailRow>
      </Journey>

      <DetailsSection>
        <DetailRow label="Booking Reference">{bookingReference}</DetailRow>
        <DetailRow label="Status">
          <span style={{ color: getStatusColor(statusLabel), fontWeight: 'bold' }}>
            {statusLabel}
          </span>
        </DetailRow>
      </DetailsSection>

      <SectionLabel>Your driver</SectionLabel>
      <DriverCard
        name={driverName}
        phone={driverPhone || undefined}
        vehicle={vehicleLabel}
        plate={vehicleRegistration}
      />

      <DetailsSection title="Payment">
        <DetailRow label="Total">
          {currency} {totalAmount.toFixed(2)}
        </DetailRow>
        <DetailRow label="Paid">
          {currency} {amountPaid.toFixed(2)} ({paymentStatusLabel})
        </DetailRow>
        {balanceDue > 0 && (
          <DetailRow label="Balance Due" emphasis>
            {currency} {balanceDue.toFixed(2)}
          </DetailRow>
        )}
        {paymentMethodLabel && (
          <DetailRow label="Payment Method">{paymentMethodLabel}</DetailRow>
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
