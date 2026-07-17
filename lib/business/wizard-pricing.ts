/**
 * Pricing arithmetic for the business booking wizard.
 *
 * Pure logic, no React — so it can be unit-tested under the repo's `testEnvironment: 'node'` jest
 * setup (there is no jsdom/testing-library, so a component test would cost more than the code it
 * covers).
 *
 * This MUST mirror the server's `calculateBusinessBookingPrice` (lib/business/price-calculation.ts),
 * which returns `basePrice + addonsPrice`. When the two disagree, the API logs
 * "SECURITY WARNING: Price discrepancy" — that warning is only meaningful if the client and server
 * agree on the happy path.
 *
 * `total_price` is deliberately DERIVED rather than stored: it previously lived in wizard state and
 * was written in two places (the vehicle step and the add-on handler), so changing vehicle after
 * picking add-ons silently dropped the add-ons from the total.
 *
 * Note `base_price` is NOT derived — it is HMAC-signed upstream (lib/security/booking-hmac.ts) and
 * must be passed through exactly as the server quoted it.
 */

export interface WizardPricedAddon {
  total_price: number;
}

/** Sum of the selected add-ons. */
export function calculateAddonsTotal(
  selectedAddons: readonly WizardPricedAddon[] | undefined
): number {
  return (selectedAddons ?? []).reduce((sum, addon) => sum + addon.total_price, 0);
}

/** Booking total = signed base price + add-ons. Mirrors the server's price calculation. */
export function calculateWizardTotal(
  basePrice: number | undefined,
  selectedAddons: readonly WizardPricedAddon[] | undefined
): number {
  return (basePrice ?? 0) + calculateAddonsTotal(selectedAddons);
}
