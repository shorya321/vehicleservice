import * as z from 'zod'

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
  seats: z.number().min(1).max(20).optional(),
  luggage_capacity: z.number().min(0).max(20).optional(),
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

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>
export type AdminVehicleFormValues = z.infer<typeof adminVehicleFormSchema>
export type VehicleMutationInput = z.infer<typeof vehicleMutationSchema>
export type AdminVehicleMutationInput = z.infer<typeof adminVehicleMutationSchema>

/** Flattens a ZodError into the first message per field, for toasting. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid vehicle details'
}
