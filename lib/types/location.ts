import { Database } from '@/lib/supabase/types'

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']

export type LocationType = 'airport' | 'city' | 'hotel' | 'station'
export type LocationStatus = 'active' | 'inactive'

export interface LocationFilters {
  search?: string
  type?: LocationType | 'all'
  status?: LocationStatus | 'all'
  country?: string | 'all'
  allowPickup?: boolean | null
  allowDropoff?: boolean | null
  page?: number
  limit?: number
}

export interface PaginatedLocations {
  locations: Location[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LocationFormData {
  name: string
  type: LocationType
  address?: string
  country_code: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  allow_pickup: boolean
  allow_dropoff: boolean
  is_active: boolean
}