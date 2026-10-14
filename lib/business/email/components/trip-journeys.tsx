import * as React from 'react';
import DetailRow from './detail-row';
import DetailsSection from './details-section';
import Journey from './journey';
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
    <>
      <DetailsSection>
        <DetailRow label="Trip type">
          {trip.label}
          {trip.groupNumber ? ` (${trip.groupNumber})` : ''}
        </DetailRow>
        {trip.hourlySummary && (
          <DetailRow label="Package">{trip.hourlySummary}, as directed</DetailRow>
        )}
        {currency && trip.discountAmount !== undefined && trip.discountAmount > 0 && (
          <DetailRow label="Round-trip saving">
            {currency} {trip.discountAmount.toFixed(2)}
          </DetailRow>
        )}
      </DetailsSection>
      {(trip.journeys ?? []).map((journey, index) => (
        <Journey
          key={index}
          label={`${journey.label}${journey.tripNumber ? ` · #${journey.tripNumber}` : ''}`}
          when={journey.pickupDateTime}
          pickup={journey.pickupLocation}
          dropoff={journey.dropoffLocation}
        />
      ))}
    </>
  );
};

export default TripJourneys;
