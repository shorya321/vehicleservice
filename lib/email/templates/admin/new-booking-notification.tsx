import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import EmailLayout from '../base/layout';
import DetailsSection from '../../components/details-section';
import Button from '../base/button';
import { emailStyles } from '../../styles/constants';
import TripDetails from '../../components/trip-details';
import DetailRow from '../../components/detail-row';
import FareLedger from '../../components/fare-ledger';
import Journey from '../../components/journey';
import SectionLabel from '../../components/section-label';
import type { EmailTripDetails } from '../../types';

interface NewBookingNotificationEmailProps {
  bookingReference: string;
  tripNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleCategory: string;
  vehicleType?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  currency: string;
  bookingDetailsUrl: string;
  trip?: EmailTripDetails;
}

export const NewBookingNotificationEmail = ({
  bookingReference,
  tripNumber,
  customerName,
  customerEmail,
  customerPhone,
  vehicleCategory,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupDate,
  pickupTime,
  totalAmount,
  currency,
  bookingDetailsUrl,
  trip,
}: NewBookingNotificationEmailProps) => {
  const isGrouped = !!trip?.legs && trip.legs.length > 0;
  const isHourly = trip?.tripType === 'hourly';
  return (
    <EmailLayout
      preview={`New Booking Received - ${tripNumber || bookingReference}`}
      heading="New Booking Received"
      eyebrow="New booking"
      reference={{ label: 'Trip', value: tripNumber || bookingReference }}
    >
      <Text style={emailStyles.text}>Hi Admin,</Text>

      <Text style={emailStyles.text}>
        A new booking has been received and payment confirmed. Here are the details:
      </Text>

      {isGrouped && trip ? (
        <>
          <SectionLabel>Journeys</SectionLabel>
          <TripDetails trip={trip} currency={currency} />
        </>
      ) : (
        <>
          <SectionLabel>Trip</SectionLabel>
          <Journey
            time={pickupTime}
            date={pickupDate}
            pickup={pickupLocation}
            dropoff={isHourly && trip ? undefined : dropoffLocation}
          />
        </>
      )}

      <DetailsSection>
        <DetailRow label="Trip #">{tripNumber || bookingReference}</DetailRow>
        <Hr style={emailStyles.hr} />
        <DetailRow label="Customer Name">{customerName}</DetailRow>
        <DetailRow label="Customer Email">{customerEmail}</DetailRow>
        <DetailRow label="Customer Phone">{customerPhone}</DetailRow>
        <Hr style={emailStyles.hr} />
        <DetailRow label="Vehicle Category">{vehicleCategory}</DetailRow>
        {vehicleType && <DetailRow label="Vehicle Type">{vehicleType}</DetailRow>}
        {!isGrouped && isHourly && trip ? (
          <>
            <Hr style={emailStyles.hr} />
            <TripDetails trip={trip} currency={currency} />
          </>
        ) : null}
      </DetailsSection>

      <FareLedger items={[]} totalLabel="Total Amount" total={`${currency} ${totalAmount.toFixed(2)}`} />

      <Button href={bookingDetailsUrl}>View Booking Details</Button>

      <Text style={emailStyles.text}>
        {isGrouped
          ? 'This is an automated notification. Each journey is its own booking: please assign a vendor to every one.'
          : 'This is an automated notification. Please review and assign a vendor to this booking.'}
      </Text>

      <Text style={emailStyles.text}>
        Best regards,
        <br />
        Infinia Transfers System
      </Text>
    </EmailLayout>
  );
};

export default NewBookingNotificationEmail;
