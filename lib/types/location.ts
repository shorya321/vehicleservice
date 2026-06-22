import { Database } from '@/lib/supabase/types'
import { LocationTypeRecord } from './location-type'

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']

export type LocationStatus = 'active' | 'inactive'

export interface LocationWithType extends Location {
  location_types?: LocationTypeRecord | null
}

export interface LocationFilters {
  search?: string
  type?: string | 'all'
  status?: LocationStatus | 'all'
  country?: string | 'all'
  allowPickup?: boolean | null
  allowDropoff?: boolean | null
  page?: number
  limit?: number
}

export interface PaginatedLocations {
  locations: LocationWithType[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LocationFormData {
  name: string
  location_type_id: string
  address?: string
  country_code: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  allow_pickup: boolean
  allow_dropoff: boolean
  is_active: boolean
  is_popular?: boolean
}

export interface LocationSearchResult {
  id: string
  name: string
  address: string | null
  city: string | null
  country_code: string
  slug: string
  country_slug: string
  latitude: number | null
  longitude: number | null
  location_type_id: string
  location_type_label: string
  location_type_icon: string
  location_type_sort: number
  allow_pickup: boolean | null
  allow_dropoff: boolean | null
  relevance: number
}

export interface GroupedLocationResults {
  label: string
  icon: string
  sortOrder: number
  locations: LocationSearchResult[]
}