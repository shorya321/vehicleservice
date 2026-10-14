import * as React from 'react';
import type { EmailTripDetails } from '../types';
import { emailStyles } from '../styles/constants';
import DetailRow from './detail-row';
import Journey from './journey';
import { Text } from '@react-email/components';

interface TripDetailsProps {
  trip: EmailTripDetails;
  currency: string;
}

/**
 * The trip block of a booking email: every journey of a round trip or
 * multi-city trip, or the package of an hourly hire. Rendered in place of the
 * single pickup/dropoff rows those templates show for a one-way transfer.
 *
 * Grouped trips render journey cards, so place this outside a DetailsSection. An hourly
 * hire renders DetailRow lines, which belong inside one.
 */
export const TripDetails = ({ trip, currency }: TripDetailsProps) => {
  if (trip.legs && trip.legs.length > 0) {
    return (
      <>
        <DetailRow label="Trip">
          {trip.label}
          {trip.groupNumber ? ` (${trip.groupNumber})` : ''}
        </DetailRow>
        <div style={{ height: '12px' }} />
        {trip.legs.map((leg, index) => (
          <Journey
            key={`${leg.label}-${index}`}
            label={`${leg.label}${leg.tripNumber ? ` · ${leg.tripNumber}` : ''}`}
            time={leg.pickupTime}
            date={leg.pickupDate}
            pickup={leg.pickupLocation}
            dropoff={leg.dropoffLocation}
          />
        ))}
        {trip.discountAmount ? (
          <Text style={{ ...emailStyles.muted, margin: '4px 0 0' }}>
            Round trip saving included: {currency} {trip.discountAmount.toFixed(2)}
          </Text>
        ) : null}
      </>
    );
  }

  if (trip.tripType === 'hourly') {
    return (
      <>
        <DetailRow label="Hire">{trip.hourlySummary || trip.label}</DetailRow>
        {trip.hourlyEndTime && <DetailRow label="Until about">{trip.hourlyEndTime}</DetailRow>}
        <DetailRow label="Route">As directed by you on the day</DetailRow>
        {trip.extraHourPrice ? (
          <Text style={{ ...emailStyles.muted, margin: '6px 0 0' }}>
            Extra hours are charged at {currency} {trip.extraHourPrice.toFixed(2)} per hour.
          </Text>
        ) : null}
      </>
    );
  }

  return null;
};

export default TripDetails;
