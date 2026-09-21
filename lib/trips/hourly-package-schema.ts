import { z } from 'zod'
import { HOURLY_PACKAGES } from './types'

/**
 * Admin form contract for one hourly package of one vehicle type.
 * Kept out of the 'use server' actions file, which may only export async functions.
 */
export const hourlyPackageInputSchema = z.object({
  package: z.enum(HOURLY_PACKAGES),
  hours: z.coerce.number().positive('Hours must be above 0').max(24, 'At most 24 hours'),
  included_km: z.coerce.number().int('Whole kilometres').min(0, 'Cannot be negative').max(2000),
  price: z.coerce.number().positive('Set a price above 0').max(1_000_000),
  extra_hour_price: z.coerce.number().min(0, 'Cannot be negative').max(100_000),
  is_active: z.boolean(),
})

export type HourlyPackageInput = z.infer<typeof hourlyPackageInputSchema>

export interface HourlyPackageRecord extends HourlyPackageInput {
  id: string | null
  currency: string
}
