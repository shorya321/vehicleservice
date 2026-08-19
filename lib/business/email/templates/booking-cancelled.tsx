import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { getBusinessBrand } from '../brand';

export interface BookingCancelledFacts {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  cancellationReason?: string;
  /** This booking's refund. Staff see the same figure on the portal booking detail. */
  refundAmount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
}

/**
 * Who is reading, and therefore what wallet surface appears.
 *
 * Three things here belong to the owner alone: the running balance, the "credited back to
 * your wallet" note, and the wallet CTA. /business/wallet redirects staff to the
 * dashboard, so shipping that button to a staff member sends them somewhere that bounces
 * them - worse than showing nothing.
 *
 * Carrying `walletUrl` in the owner arm rather than alongside the facts means the staff
 * variant cannot render the button even by accident. See the same reasoning, at more
 * length, in ./booking-confirmation.tsx.
 */
type WalletView =
  | { audience: 'owner'; newBalance: number; walletUrl: string }
  | { audience: 'creator' };

export type BusinessBookingCancelledEmailProps = BookingCancelledFacts & WalletView;

export const BusinessBookingCancelledEmail = (props: BusinessBookingCancelledEmailProps) => {
  // One object, not a destructured signature, so `props.audience` still narrows the
  // owner-only fields below.
  const {
    businessName,
    bookingNumber,
    tripNumber,
    customerName,
    pickupLocation,
    dropoffLocation,
    pickupDateTime,
    cancellationReason,
    refundAmount,
    currency,
    originalAmount,
    originalCurrency,
    bookedBy,
  } = props;
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${tripNumber || bookingNumber}`}
      heading="Booking Cancelled"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="warning">
        Booking <strong>#{tripNumber || bookingNumber}</strong> has been cancelled.
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Cancelled Booking Details:</strong>
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
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Date & Time:</strong> {pickupDateTime}
        </Text>
        {cancellationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.detailRow}>
              <strong>Reason:</strong> {cancellationReason}
            </Text>
          </>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Refund Summary:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Refund Amount:</strong> {currency} {refundAmount.toFixed(2)}
        </Text>
        {showChargeNote && (
          <Text style={{ ...emailStyles.muted, fontSize: '13px' }}>
            Refunded in {originalCurrency} {originalAmount!.toFixed(2)}
          </Text>
        )}
        {props.audience === 'owner' && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.totalRow}>
              <strong>New Wallet Balance:</strong> {currency} {props.newBalance.toFixed(2)}
            </Text>
          </>
        )}
      </DetailsSection>

      {props.audience === 'owner' && (
        <>
          {/*
            Gated on an actual refund, not just on the audience. Deleting a booking from
            the portal reuses this template and never moves money, so an unconditional
            "credited back to your wallet" would tell the owner a refund happened when
            none did.
          */}
          {refundAmount > 0 && (
            <InfoBox type="success">
              The refund has been automatically credited back to your wallet.
            </InfoBox>
          )}

          <Button href={props.walletUrl}>View Wallet Balance</Button>
        </>
      )}

      <Text style={emailStyles.text}>
        If you have any questions about this cancellation, please contact our support team.
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingCancelledEmail;
