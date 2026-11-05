/** Fallback shown when a booking carries no usable name at all. */
export const UNKNOWN_CUSTOMER_NAME = 'Customer'

export interface PassengerNameParts {
  first_name: string | null
  last_name: string | null
}

function clean(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Name to show for a B2C booking in vendor, driver and admin emails.
 *
 * The primary passenger comes first: it is who travels, and it is the only name a
 * guest booking has (guest checkout leaves customer_id NULL, so there is no profile).
 * The account holder's profile name covers older rows without a passenger.
 */
export function resolveCustomerDisplayName(
  passenger: PassengerNameParts | null,
  profileName: string | null
): string {
  const passengerName = clean(`${clean(passenger?.first_name)} ${clean(passenger?.last_name)}`)
  if (passengerName) return passengerName
  return clean(profileName) || UNKNOWN_CUSTOMER_NAME
}
