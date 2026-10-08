import { Hr, Text } from '@react-email/components';
import * as React from 'react';
import DetailsSection from './details-section';
import { emailStyles } from '../styles/constants';
import type { BusinessEmailTrip } from '../trip';

interface TripJourneysProps {
  trip: BusinessEmailTrip;
  /** Shown on owner-facing copies only; the passenger never sees prices. */
  currency?: string;
}

/**
 * The trip block of a business booking email: what kind of trip it is and every journey in it.
 * SCOPE: Business module ONLY.
 */
export const TripJourneys = ({ trip, currency }: TripJourneysProps) => {
  return (
    <DetailsSection>
      <Text style={emailStyles.detailRow}>
        <strong>Trip type:</strong> {trip.label}
        {trip.groupNumber ? ` (${trip.groupNumber})` : ''}
      </Text>
      {trip.hourlySummary && (
        <Text style={emailStyles.detailRow}>
          <strong>Package:</strong> {trip.hourlySummary}, as directed
        </Text>
      )}
      {(trip.journeys ?? []).map((journey, index) => (
        <React.Fragment key={index}>
          <Hr style={emailStyles.hr} />
          <Text style={emailStyles.detailRow}>
            <strong>{journey.label}</strong>
            {journey.tripNumber ? ` · #${journey.tripNumber}` : ''}
          </Text>
          <Text style={emailStyles.detailRow}>
            <strong>Pickup:</strong> {journey.pickupLocation}
          </Text>
          <Text style={emailStyles.detailRow}>
            <strong>Dropoff:</strong> {journey.dropoffLocation}
          </Text>
          <Text style={emailStyles.detailRow}>
            <strong>Date & Time:</strong> {journey.pickupDateTime}
          </Text>
        </React.Fragment>
      ))}
      {currency && trip.discountAmount !== undefined && trip.discountAmount > 0 && (
        <>
          <Hr style={emailStyles.hr} />
          <Text style={emailStyles.detailRow}>
            <strong>Round-trip saving:</strong> {currency} {trip.discountAmount.toFixed(2)}
          </Text>
        </>
      )}
    </DetailsSection>
  );
};

export default TripJourneys;
