import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import { emailStyles } from '../styles/constants';
import { formatGuestSummary } from '@/lib/business/guest-breakdown';
import { formatChildAges } from '@/lib/business/format-child-ages';
import { getBusinessBrand } from '../brand';

export interface BookingConfirmationFacts {
  businessName: string;
  bookingNumber: string;
  tripNumber?: string;
  customerName: string;
  customerPhone?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  vehicleType: string;
  /** Every guest (adults + children + infants). */
  passengerCount: number;
  adults?: number;
  children?: number;
  infants?: number;
  totalPrice: number;
  currency: string;
  /** This booking's charge. Staff see the same figure on the portal booking detail. */
  walletDeducted: number;
  bookingUrl: string;
  referenceNumber?: string;
  extras?: Array<{ label: string; quantity: number; price: number; childAges?: number[] }>;
  originalAmount?: number;
  originalCurrency?: string;
  /** "Booked by Priya Sharma (staff)". Owner copies only; see ../components/booked-by. */
  bookedBy?: string;
}

/**
 * Who is reading, and therefore whether the tenant's running balance appears.
 *
 * The portal hides the wallet from staff - the dashboard zeroes the balance tile and
 * /business/wallet redirects them away - so a staff copy of this email must not carry it.
 *
 * A discriminated union rather than an optional `newBalance`, because the failure mode of
 * an optional field is silent: forget it on an owner send and a figure quietly vanishes
 * with nothing failing. lib/email/types.ts:36 makes the same argument for the same reason.
 * Here the union goes further than "required" can - it makes the balance unrepresentable
 * on a staff email rather than merely mandatory on an owner one.
 */
type WalletView =
  | { audience: 'owner'; newBalance: number }
  | { audience: 'creator' };

export type BusinessBookingConfirmationEmailProps = BookingConfirmationFacts & WalletView;

export const BusinessBookingConfirmationEmail = (
  props: BusinessBookingConfirmationEmailProps
) => {
  // Taken as one object rather than destructured in the signature so `props.audience`
  // still narrows `props.newBalance` further down. Destructuring the discriminant into a
  // local would leave the balance unreachable.
  const {
    businessName,
    bookingNumber,
    tripNumber,
    customerName,
    customerPhone,
    pickupLocation,
    dropoffLocation,
    pickupDateTime,
    vehicleType,
    passengerCount,
    adults,
    children,
    infants,
    totalPrice,
    currency,
    walletDeducted,
    bookingUrl,
    referenceNumber,
    extras,
    originalAmount,
    originalCurrency,
    bookedBy,
  } = props;
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  // Older bookings predate the guest breakdown. Fall back to the seated count.
  const passengerLabel =
    adults != null
      ? formatGuestSummary({ adults, children: children ?? 0, infants: infants ?? 0 })
      : passengerCount;
  return (
    <EmailLayout
      preview={`Booking Created - ${tripNumber || bookingNumber}`}
      heading="Booking Confirmation"
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="success">
        Your booking <strong>#{tripNumber || bookingNumber}</strong> has been created successfully!
      </InfoBox>

      <Text style={emailStyles.text}>
        <strong>Customer Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Trip #:</strong> {tripNumber || bookingNumber}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Customer Name:</strong> {customerName}
        </Text>
        {customerPhone && (
          <Text style={emailStyles.detailRow}>
            <strong>Phone:</strong> {customerPhone}
          </Text>
        )}
        {referenceNumber && (
          <Text style={emailStyles.detailRow}>
            <strong>Reference #:</strong> {referenceNumber}
          </Text>
        )}
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Trip Details:</strong>
      </Text>

      <DetailsSection>
        <Text style={emailStyles.detailRow}>
          <strong>Pickup:</strong> {pickupLocation}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Dropoff:</strong> {dropoffLocation}
        </Text>
        <Hr style={emailStyles.hr} />
        <Text style={emailStyles.detailRow}>
          <strong>Date & Time:</strong> {pickupDateTime}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Vehicle:</strong> {vehicleType}
        </Text>
        <Text style={emailStyles.detailRow}>
          <strong>Passengers:</strong> {passengerLabel}
        </Text>
      </DetailsSection>

      <Text style={emailStyles.text}>
        <strong>Payment Summary:</strong>
      </Text>

      <DetailsSection>
        {extras && extras.length > 0 && extras.map((extra, index) => (
          <Text key={index} style={emailStyles.detailRow}>
            <strong>{extra.label}{extra.quantity > 1 ? ` x${extra.quantity}` : ''}{formatChildAges(extra.childAges)}:</strong>{' '}
            {currency} {extra.price.toFixed(2)}
          </Text>
        ))}
        <Text style={emailStyles.detailRow}>
          <strong>Booking Total:</strong> {currency} {totalPrice.toFixed(2)}
        </Text>
        {showChargeNote && (
          <Text style={{ ...emailStyles.muted, fontSize: '13px' }}>
            Payment charged in {originalCurrency} {originalAmount!.toFixed(2)}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Deducted from Wallet:</strong> {currency} {walletDeducted.toFixed(2)}
        </Text>
        {props.audience === 'owner' && (
          <>
            <Hr style={emailStyles.hr} />
            <Text style={emailStyles.totalRow}>
              <strong>New Wallet Balance:</strong> {currency} {props.newBalance.toFixed(2)}
            </Text>
          </>
        )}
      </DetailsSection>

      <Button href={bookingUrl}>View Booking Details</Button>

      <InfoBox type="info" title="What's Next?">
        Our team will assign a vendor to your booking. You&apos;ll receive a notification once a driver
        has been assigned.
      </InfoBox>

      <Text style={emailStyles.text}>
        Thank you for using {getBusinessBrand().name}!
        <br />
        <br />
        Best regards,
        <br />
        The {getBusinessBrand().name} Team
      </Text>
    </EmailLayout>
  );
};

export default BusinessBookingConfirmationEmail;
