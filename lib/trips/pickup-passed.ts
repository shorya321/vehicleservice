/**
 * True once the earliest pickup of a booking (or of a trip's journeys) has come.
 * An unpaid booking stays open indefinitely, so the payment page asks this
 * before it offers a card form: nobody should pay for a pickup already gone.
 * Elapsed time needs no timezone, so this compares instants directly.
 */
export function firstPickupHasPassed(pickupIsos: ReadonlyArray<string | null | undefined>, now: Date = new Date()): boolean {
  const times = pickupIsos
    .map((iso) => (iso ? new Date(iso).getTime() : Number.NaN))
    .filter((time) => Number.isFinite(time))
  return times.length > 0 && Math.min(...times) <= now.getTime()
}
