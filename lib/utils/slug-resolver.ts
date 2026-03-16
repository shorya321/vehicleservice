'use server'

import { createClient } from '@/lib/supabase/server'

export interface ResolvedLocation {
  id: string
  name: string
  slug: string
  city: string | null
  country_code: string | null
  zone_id: string | null
  latitude: number | null
  longitude: number | null
}

export interface ResolvedZone {
  id: string
  name: string
  slug: string
  description: string | null
}

export type ResolvedRoute =
  | {
      type: 'location'
      origin: ResolvedLocation
      destination: ResolvedLocation
    }
  | {
      type: 'zone'
      origin: ResolvedZone
      destination: ResolvedZone
    }

/**
 * Resolve origin and destination slugs to their database records.
 * Tries locations first, then falls back to zones.
 */
export async function resolveRouteSlugs(
  originSlug: string,
  destSlug: string
): Promise<ResolvedRoute | null> {
  const supabase = await createClient()

  // Try locations first
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, slug, city, country_code, zone_id, latitude, longitude')
    .in('slug', [originSlug, destSlug])
    .eq('is_active', true)

  if (locations && locations.length === 2) {
    const origin = locations.find((l) => l.slug === originSlug)
    const destination = locations.find((l) => l.slug === destSlug)
    if (origin && destination) {
      return { type: 'location', origin, destination }
    }
  }

  // If we found one location but not the other, it's not a valid pair
  // Try zones as fallback
  const { data: zones } = await supabase
    .from('zones')
    .select('id, name, slug, description')
    .in('slug', [originSlug, destSlug])

  if (zones && zones.length === 2) {
    const origin = zones.find((z) => z.slug === originSlug)
    const destination = zones.find((z) => z.slug === destSlug)
    if (origin && destination) {
      return { type: 'zone', origin, destination }
    }
  }

  return null
}

/**
 * Resolve a vehicle type slug to its database record.
 */
export async function resolveVehicleTypeSlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicle_types')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
