import type { SupabaseClient } from '@supabase/supabase-js'

import {
  capacityIssues,
  VEHICLE_TYPE_CAPACITY_SELECT,
  type CapacityInput,
  type TypeCapacity,
} from './capacity'

export interface VehicleTypeCheckInput extends CapacityInput {
  category_id: string
}

export type VehicleTypeCheckResult = { type: TypeCapacity } | { error: string }

/**
 * Server-side gate for the vendor and admin vehicle writes.
 *
 * The forms carry the type's capacities in their own state, so the client can
 * report a breach immediately, but the client's copy is not evidence. This
 * re-reads the type from the database and rejects anything that exceeds it,
 * which is what actually protects the data.
 *
 * It also confirms the type belongs to the submitted category. Pairing a
 * category with a type from a different category would advertise capacities the
 * vendor never chose, which is the same defect by another route.
 */
export async function loadValidatedVehicleType(
  supabase: SupabaseClient,
  values: VehicleTypeCheckInput
): Promise<VehicleTypeCheckResult> {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select(VEHICLE_TYPE_CAPACITY_SELECT)
    .eq('id', values.vehicle_type_id)
    .single()

  if (error || !data) {
    return { error: 'Selected vehicle type is not available' }
  }

  const type = data as TypeCapacity

  if (type.category_id !== values.category_id) {
    return { error: 'Vehicle type does not belong to the selected category' }
  }

  const issues = capacityIssues(values, type)

  if (issues.length > 0) {
    return { error: issues[0].message }
  }

  return { type }
}
