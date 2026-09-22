import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import { emailStyles } from '../styles/constants';
import type { EmailTripDetails } from '../types';

interface TripDetailsProps {
  trip: EmailTripDetails;
  currency: string;
}

/**
 * The trip block of a booking email: every journey of a round trip or
 * multi-city trip, or the package of an hourly hire. Rendered in place of the
 * single pickup/dropoff rows those templates show for a one-way transfer.
 */
export const TripDetails = ({ trip, currency }: TripDetailsProps) => {
  if (trip.legs && trip.legs.length > 0) {
    return (
      <>
        <Text style={emailStyles.detailRow}>
          <strong>Trip:</strong> {trip.label}
          {trip.groupNumber ? ` (${trip.groupNumber})` : ''}
        </Text>
        {trip.legs.map((leg, index) => (
          <React.Fragment key={`${leg.label}-${index}`}>
            <Hr style={emailStyles.hr} />
            <Text style={{ ...emailStyles.detailRow, fontWeight: 'bold' }}>
              {leg.label}
              {leg.tripNumber ? ` · ${leg.tripNumber}` : ''}
            </Text>
            <Text style={emailStyles.detailRow}>
              <strong>From:</strong> {leg.pickupLocation}
            </Text>
            <Text style={emailStyles.detailRow}>
              <strong>To:</strong> {leg.dropoffLocation}
            </Text>
            <Text style={emailStyles.detailRow}>
              <strong>Pickup:</strong> {leg.pickupDate} at {leg.pickupTime}
            </Text>
          </React.Fragment>
        ))}
        {trip.discountAmount ? (
          <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
            Round trip saving included: {currency} {trip.discountAmount.toFixed(2)}
          </Text>
        ) : null}
      </>
    );
  }

  if (trip.tripType === 'hourly') {
    return (
      <>
        <Text style={emailStyles.detailRow}>
          <strong>Hire:</strong> {trip.hourlySummary || trip.label}
        </Text>
        {trip.hourlyEndTime && (
          <Text style={emailStyles.detailRow}>
            <strong>Until about:</strong> {trip.hourlyEndTime}
          </Text>
        )}
        <Text style={emailStyles.detailRow}>
          <strong>Route:</strong> As directed by you on the day
        </Text>
        {trip.extraHourPrice ? (
          <Text style={{ ...emailStyles.detailRow, fontSize: '13px', color: '#666666' }}>
            Extra hours are charged at {currency} {trip.extraHourPrice.toFixed(2)} per hour.
          </Text>
        ) : null}
      </>
    );
  }

  return null;
};

export default TripDetails;
