'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { HOURLY_PACKAGE_DEFAULTS } from '@/lib/trips/constants'
import {
  hourlyPackageInputSchema,
  type HourlyPackageInput,
  type HourlyPackageRecord,
} from '@/lib/trips/hourly-package-schema'
import { HOURLY_PACKAGES, isHourlyPackage } from '@/lib/trips/types'

/**
 * Both packages for a vehicle type, whether or not they have been saved yet.
 * An unsaved package comes back inactive with the suggested hours and km, so
 * the admin form always shows both rows.
 */
export async function getHourlyPackages(vehicleTypeId: string): Promise<HourlyPackageRecord[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicle_type_hourly_packages')
    .select('id, package, hours, included_km, price, extra_hour_price, currency, is_active')
    .eq('vehicle_type_id', vehicleTypeId)

  if (error) {
    console.error('[HourlyPackages] fetch failed:', error.message)
  }

  return HOURLY_PACKAGES.map((pkg) => {
    const row = data?.find((candidate) => candidate.package === pkg)
    if (row && isHourlyPackage(row.package)) {
      return {
        id: row.id,
        package: row.package,
        hours: Number(row.hours),
        included_km: row.included_km,
        price: Number(row.price),
        extra_hour_price: Number(row.extra_hour_price),
        currency: row.currency,
        is_active: row.is_active,
      }
    }
    return {
      id: null,
      package: pkg,
      hours: HOURLY_PACKAGE_DEFAULTS[pkg].hours,
      included_km: HOURLY_PACKAGE_DEFAULTS[pkg].includedKm,
      price: 0,
      extra_hour_price: 0,
      currency: 'AED',
      is_active: false,
    }
  })
}

/**
 * Saves one package. An inactive package with no price yet is allowed to stay
 * unsaved, so turning a row off never forces the admin to invent a price.
 */
export async function saveHourlyPackage(
  vehicleTypeId: string,
  input: HourlyPackageInput
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const parsed = hourlyPackageInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid package' }
  }

  const values = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('vehicle_type_hourly_packages')
    .upsert(
      {
        vehicle_type_id: vehicleTypeId,
        package: values.package,
        hours: values.hours,
        included_km: values.included_km,
        price: values.price,
        extra_hour_price: values.extra_hour_price,
        is_active: values.is_active,
      },
      { onConflict: 'vehicle_type_id,package' }
    )

  if (error) {
    console.error('[HourlyPackages] save failed:', error.message)
    return { success: false, error: 'Could not save the package. Please try again.' }
  }

  revalidatePath(`/admin/vehicle-types/${vehicleTypeId}/edit`)
  return { success: true }
}
