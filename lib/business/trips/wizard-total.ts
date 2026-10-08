/**
 * Trip total as the wizard shows it. Must mirror the create route: the signed trip fares plus the
 * add-ons once per journey (the same passengers ride every journey of a trip).
 * SCOPE: Business module ONLY.
 */
import { fromCents, toCents } from './pricing';

export function businessTripWizardTotal(basePrice: number | undefined, addonsPerJourney: number, journeys: number): number {
  return fromCents(toCents(basePrice ?? 0) + toCents(addonsPerJourney) * Math.max(journeys, 1));
}
