/**
 * Number inputs report an empty field as NaN. Mapping that to undefined keeps
 * the optional schema fields optional.
 *
 * The forms previously used `parseInt(value) || undefined`, which also swallowed
 * a legitimate 0 — so a vendor could never record a vehicle that takes no
 * luggage.
 */
export function toOptionalNumber(value: number): number | undefined {
  return Number.isNaN(value) ? undefined : value
}
