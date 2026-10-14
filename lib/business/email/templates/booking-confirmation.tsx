import { Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from './base/layout';
import Button from './base/button';
import DetailsSection from '../components/details-section';
import InfoBox from '../components/info-box';
import BookedBy from '../components/booked-by';
import DetailRow from '../components/detail-row';
import FareLedger from '../components/fare-ledger';
import Journey from '../components/journey';
import SectionLabel from '../components/section-label';
import { emailStyles } from '../styles/constants';
import { formatGuestSummary } from '@/lib/business/guest-breakdown';
import { formatChildAges } from '@/lib/business/format-child-ages';
import { getBusinessBrand } from '../brand';
import TripJourneys from '../components/trip-journeys';
import { businessTripEmailReference, type BusinessEmailTrip } from '../trip';

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
  /** Round trip, multi-city or hourly. Absent for one way, which renders as before. */
  trip?: BusinessEmailTrip;
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
    trip,
  } = props;
  const reference = businessTripEmailReference(trip, tripNumber || bookingNumber);
  const hasJourneys = Boolean(trip?.journeys?.length);
  const showChargeNote = originalCurrency && originalCurrency !== currency && originalAmount;
  // Older bookings predate the guest breakdown. Fall back to the seated count.
  const passengerLabel =
    adults != null
      ? formatGuestSummary({ adults, children: children ?? 0, infants: infants ?? 0 })
      : passengerCount;
  return (
    <EmailLayout
      preview={`Booking Created - ${reference}`}
      heading="Booking Confirmation"
      eyebrow="Booking confirmed"
      tone="success"
      reference={{ label: 'Trip', value: reference }}
    >
      <Text style={emailStyles.text}>Hi {businessName},</Text>

      <BookedBy bookedBy={bookedBy} />

      <InfoBox type="success">
        Your {trip ? trip.label.toLowerCase() + ' ' : ''}booking <strong>#{reference}</strong> has been created successfully!
      </InfoBox>

      <DetailsSection title="Customer Details">
        <DetailRow label="Trip #">{tripNumber || bookingNumber}</DetailRow>
        <DetailRow label="Customer Name">{customerName}</DetailRow>
        {customerPhone && <DetailRow label="Phone">{customerPhone}</DetailRow>}
        {referenceNumber && <DetailRow label="Reference #">{referenceNumber}</DetailRow>}
      </DetailsSection>

      <SectionLabel>Trip Details</SectionLabel>

      {trip && <TripJourneys trip={trip} currency={currency} />}

      {!hasJourneys && (
        <Journey when={pickupDateTime} pickup={pickupLocation} dropoff={dropoffLocation} />
      )}

      <DetailsSection>
        <DetailRow label="Vehicle">{vehicleType}</DetailRow>
        <DetailRow label="Passengers">{passengerLabel}</DetailRow>
      </DetailsSection>

      <SectionLabel>Payment Summary</SectionLabel>

      <FareLedger
        items={(extras && extras.length > 0 ? extras : []).map((extra) => ({
          label: `${extra.label}${extra.quantity > 1 ? ` x${extra.quantity}` : ''}${formatChildAges(extra.childAges)}`,
          amount: `${currency} ${extra.price.toFixed(2)}`,
        }))}
        totalLabel="Booking Total"
        total={`${currency} ${totalPrice.toFixed(2)}`}
        note={
          showChargeNote
            ? `Payment charged in ${originalCurrency} ${originalAmount!.toFixed(2)}`
            : undefined
        }
      />

      <DetailsSection>
        <DetailRow label="Deducted from Wallet">
          {currency} {walletDeducted.toFixed(2)}
        </DetailRow>
        {props.audience === 'owner' && (
          <DetailRow label="New Wallet Balance" emphasis>
            {currency} {props.newBalance.toFixed(2)}
          </DetailRow>
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
