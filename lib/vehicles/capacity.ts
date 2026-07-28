/**
 * A vehicle's own seats/luggage numbers must never exceed the capacity of the
 * vehicle type it is attached to.
 *
 * This matters because every customer-facing surface (search results, route
 * pages, checkout pricing) advertises the *type's* passenger_capacity and
 * luggage_capacity, never the individual vehicle's. A vendor filing a 20-seat
 * car under a 4-passenger type does not change what the customer sees, it just
 * makes the fleet record disagree with what is being sold.
 *
 * Kept free of imports so both client components and server actions can use it.
 * In particular it must not import from ./schema, which imports this.
 */

export const DEFAULT_LUGGAGE_CAPACITY = 2

/** Columns the server actions need to enforce the rule. */
export const VEHICLE_TYPE_CAPACITY_SELECT =
  'id, name, category_id, passenger_capacity, luggage_capacity'

/**
 * Shape of a vehicle_types row, narrowed to what capacity checks need.
 * passenger_capacity is NOT NULL in the schema; luggage_capacity is nullable.
 */
export interface TypeCapacity {
  id: string
  name: string
  category_id: string | null
  passenger_capacity: number
  luggage_capacity: number | null
}

/** The subset of vehicle form values the capacity rule reads. */
export interface CapacityInput {
  vehicle_type_id: string
  seats?: number
  luggage_capacity?: number
}

export type CapacityIssuePath = 'seats' | 'luggage_capacity'

export interface CapacityIssue {
  path: CapacityIssuePath
  message: string
}

/** A type's luggage allowance, with the nullable column resolved. */
export function typeLuggageCapacity(type: TypeCapacity): number {
  return type.luggage_capacity ?? DEFAULT_LUGGAGE_CAPACITY
}

/**
 * The single source of truth for the rule, shared by the forms and the server
 * actions.
 *
 * An unknown type yields no issues: on the client that only means the type list
 * has not loaded yet, and the server actions reject a genuinely missing type
 * separately, with a clearer message than a capacity error would give.
 */
export function capacityIssues(
  values: CapacityInput,
  type: TypeCapacity | undefined
): CapacityIssue[] {
  if (!type) return []

  const issues: CapacityIssue[] = []

  if (values.seats !== undefined && values.seats > type.passenger_capacity) {
    issues.push({
      path: 'seats',
      message: `Cannot exceed ${type.passenger_capacity} passengers for ${type.name}`,
    })
  }

  const maxLuggage = typeLuggageCapacity(type)

  if (values.luggage_capacity !== undefined && values.luggage_capacity > maxLuggage) {
    issues.push({
      path: 'luggage_capacity',
      message: `Cannot exceed ${maxLuggage} ${maxLuggage === 1 ? 'bag' : 'bags'} for ${type.name}`,
    })
  }

  return issues
}

/**
 * Luggage capacity to persist. A blank field falls back to the default, capped
 * by the type, so the fallback itself can never breach a one-bag type. An
 * explicit 0 is preserved.
 */
export function resolveLuggageCapacity(
  input: number | undefined,
  type: TypeCapacity | undefined
): number {
  if (input !== undefined) return input
  if (!type) return DEFAULT_LUGGAGE_CAPACITY

  return Math.min(DEFAULT_LUGGAGE_CAPACITY, typeLuggageCapacity(type))
}
