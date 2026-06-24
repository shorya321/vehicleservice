import { Database } from '@/lib/supabase/types'
import { Location } from './location'

export type Route = Database['public']['Tables']['routes']['Row']
export type RouteInsert = Database['public']['Tables']['routes']['Insert']
export type RouteUpdate = Database['public']['Tables']['routes']['Update']

export interface RouteWithLocations extends Route {
  origin_location: Location
  destination_location: Location
}

export interface RouteWithDetails extends RouteWithLocations {
}

export interface RouteFilters {
  search?: string
  originLocationId?: string
  destinationLocationId?: string
  isActive?: boolean | 'all'
  isPopular?: boolean | 'all'
  page?: number
  limit?: number
}

export interface PaginatedRoutes {
  routes: RouteWithDetails[]
  total: number
  page: number
  limit: number
  totalPages: number
}
