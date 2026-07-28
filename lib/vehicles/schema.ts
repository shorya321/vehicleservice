import * as z from 'zod'

import { capacityIssues, type CapacityInput, type TypeCapacity } from './capacity'

const currentYear = new Date().getFullYear()

/**
 * Shared between the vendor form, the admin form, and both server actions.
 *
 * The server actions parse this too: previously they validated nothing and
 * trusted whatever the client sent.
 */
export const vehicleFormSchema = z.object({
  make: z.string().min(2, 'Make must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  year: z
    .number()
    .min(1900, 'Year must be 1900 or later')
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`),
  registration_number: z.string().min(3, 'Registration number is required'),
  category_id: z.string().min(1, 'Category is required'),
  vehicle_type_id: z.string().min(1, 'Vehicle type is required'),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  // Both fields start at 0 on a blank form, so these messages are what a vendor
  // sees when they submit without filling seats in. Zod's stock wording
  // ("Number must be greater than or equal to 1") is not good enough for that.
  seats: z
    .number()
    .min(1, 'Enter the number of seats')
    .max(20, 'Seats cannot exceed 20')
    .optional(),
  luggage_capacity: z
    .number()
    .min(0, 'Luggage capacity cannot be negative')
    .max(20, 'Luggage capacity cannot exceed 20')
    .optional(),
  is_available: z.boolean(),
})

export const adminVehicleFormSchema = vehicleFormSchema.extend({
  business_id: z.string().min(1, 'Vendor is required'),
})

/**
 * The image now reaches the server as a URL. It is uploaded directly from the
 * browser to Supabase Storage, because passing it inline as base64 exceeded
 * the 1 MB Server Action body limit.
 */
const primaryImageUrl = z.string().url('Invalid image URL').nullable()

export const vehicleMutationSchema = vehicleFormSchema.extend({ primaryImageUrl })
export const adminVehicleMutationSchema = adminVehicleFormSchema.extend({ primaryImageUrl })

/**
 * The capacity ceiling depends on the vehicle type that is currently selected,
 * so it cannot live in the static schema. The forms rebuild their resolver
 * whenever the loaded type list changes; the server actions look the type up
 * themselves rather than trusting the client's copy of it.
 */
function capacityRefinement(types: readonly TypeCapacity[]) {
  const byId = new Map(types.map((type) => [type.id, type]))

  return (values: CapacityInput, ctx: z.RefinementCtx): void => {
    for (const issue of capacityIssues(values, byId.get(values.vehicle_type_id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [issue.path],
        message: issue.message,
      })
    }
  }
}

export function buildVehicleFormSchema(types: readonly TypeCapacity[]) {
  return vehicleFormSchema.superRefine(capacityRefinement(types))
}

export function buildAdminVehicleFormSchema(types: readonly TypeCapacity[]) {
  return adminVehicleFormSchema.superRefine(capacityRefinement(types))
}

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>
export type AdminVehicleFormValues = z.infer<typeof adminVehicleFormSchema>
export type VehicleMutationInput = z.infer<typeof vehicleMutationSchema>
export type AdminVehicleMutationInput = z.infer<typeof adminVehicleMutationSchema>

/** Flattens a ZodError into the first message per field, for toasting. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid vehicle details'
}
