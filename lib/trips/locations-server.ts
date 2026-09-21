import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export interface TripLocation {
  id: string
  name: string
  slug: string
  address: string | null
  zoneId: string | null
  allowPickup: boolean
  allowDropoff: boolean
}

const LOCATION_COLUMNS = 'id, name, slug, address, zone_id, allow_pickup, allow_dropoff'

function toTripLocation(row: {
  id: string
  name: string
  slug: string
  address: string | null
  zone_id: string | null
  allow_pickup: boolean | null
  allow_dropoff: boolean | null
}): TripLocation {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    zoneId: row.zone_id,
    // Null means "not restricted", matching how the search autocomplete treats it.
    allowPickup: row.allow_pickup !== false,
    allowDropoff: row.allow_dropoff !== false,
  }
}

/** Active locations for the given slugs, keyed by slug. Missing slugs are simply absent. */
export async function resolveLocationsBySlug(
  supabase: Client,
  slugs: string[]
): Promise<Map<string, TripLocation>> {
  const unique = Array.from(new Set(slugs))
  const bySlug = new Map<string, TripLocation>()
  if (unique.length === 0) return bySlug

  const { data, error } = await supabase
    .from('locations')
    .select(LOCATION_COLUMNS)
    .in('slug', unique)
    .eq('is_active', true)

  if (error) {
    console.error('[trips] location lookup failed:', error.message)
    return bySlug
  }

  for (const row of data ?? []) bySlug.set(row.slug, toTripLocation(row))
  return bySlug
}

export async function resolveLocationBySlug(supabase: Client, slug: string): Promise<TripLocation | null> {
  const bySlug = await resolveLocationsBySlug(supabase, [slug])
  return bySlug.get(slug) ?? null
}

/** Active locations by id, keyed by id. */
export async function resolveLocationsById(
  supabase: Client,
  ids: string[]
): Promise<Map<string, TripLocation>> {
  const unique = Array.from(new Set(ids))
  const byId = new Map<string, TripLocation>()
  if (unique.length === 0) return byId

  const { data, error } = await supabase
    .from('locations')
    .select(LOCATION_COLUMNS)
    .in('id', unique)
    .eq('is_active', true)

  if (error) {
    console.error('[trips] location lookup failed:', error.message)
    return byId
  }

  for (const row of data ?? []) byId.set(row.id, toTripLocation(row))
  return byId
}

/** Estimated drive minutes between two locations, from `routes`, or null if no route is recorded. */
export async function getRouteDurationMinutes(
  supabase: Client,
  fromLocationId: string,
  toLocationId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('estimated_duration_minutes')
    .eq('origin_location_id', fromLocationId)
    .eq('destination_location_id', toLocationId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[trips] route duration lookup failed:', error.message)
    return null
  }
  return data?.estimated_duration_minutes ?? null
}
