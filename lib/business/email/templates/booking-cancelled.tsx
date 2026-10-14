import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import DetailRow from '../components/detail-row';
import Journey from '../components/journey';
import SectionLabel from '../components/section-label';
import StatBlock from '../components/stat-block';
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
  /** "Round trip BG-..., return journey" when this booking is one journey of a trip. */
  tripContext?: string;
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
    tripContext,
  } = props;
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  return (
    <EmailLayout
      preview={`Booking Cancelled - ${tripNumber || bookingNumber}`}
      heading="Booking Cancelled"
      eyebrow="Booking cancelled"
      tone="danger"
      reference={{ label: 'Trip', value: tripNumber || bookingNumber }}
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="warning">
        Booking <strong>#{tripNumber || bookingNumber}</strong> has been cancelled.
      </InfoBox>

      <SectionLabel>Cancelled Booking Details</SectionLabel>

      <Journey when={pickupDateTime} pickup={pickupLocation} dropoff={dropoffLocation} />

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        {tripContext && <DetailRow label="Part of">{tripContext}</DetailRow>}
        <DetailRow label="Customer">{customerName}</DetailRow>
        {cancellationReason && (
          <>
            <Hr style={emailStyles.hr} />
            <DetailRow label="Reason">{cancellationReason}</DetailRow>
          </>
        )}
      </DetailsSection>

      <SectionLabel>Refund Summary</SectionLabel>

      <StatBlock label="Refund Amount" value={`${currency} ${refundAmount.toFixed(2)}`}>
        {showChargeNote ? `Refunded in ${originalCurrency} ${originalAmount!.toFixed(2)}` : null}
      </StatBlock>

      {props.audience === 'owner' && (
        <DetailsSection>
          <DetailRow label="New Wallet Balance" emphasis>
            {currency} {props.newBalance.toFixed(2)}
          </DetailRow>
        </DetailsSection>
      )}

      {props.audience === 'owner' && (
        <>
          {/*
            Gated on an actual refund, not just on the audience. Deleting a booking from
            the portal reuses this template and never moves money, so an unconditional
            "credited back to your wallet" would tell the owner a refund happened when
            none did.
          */}
          {refundAmount > 0 ? (
            <InfoBox type="success">
              The refund has been automatically credited back to your wallet.
            </InfoBox>
          ) : (
            /*
              The other half of the same argument. A bare "Refund Amount: 0.00"
              with nothing beside it reads as a system error rather than as
              policy, and leaves the owner waiting for money that is not coming
              on its own. Cancelling and deleting both land here.
            */
            <InfoBox type="info">
              The amount held for this booking has not been returned to your wallet
              automatically. Refunds are reviewed and issued by our team - contact us
              if you believe one is due.
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
