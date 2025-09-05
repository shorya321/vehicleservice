import { Database } from '@/lib/supabase/types'
import { Location } from './location'
import { VendorApplication } from './vendor-application'
import { VehicleTypeWithCategory } from './vehicle'

export type Route = Database['public']['Tables']['routes']['Row']
export type RouteInsert = Database['public']['Tables']['routes']['Insert']
export type RouteUpdate = Database['public']['Tables']['routes']['Update']

export type RouteSearch = Database['public']['Tables']['route_searches']['Row']
export type RouteSearchInsert = Database['public']['Tables']['route_searches']['Insert']

// Removed vendor_route_services and route_vehicle_type_pricing types as tables no longer exist

export interface RouteWithLocations extends Route {
  origin_location: Location
  destination_location: Location
}

export interface RouteWithDetails extends RouteWithLocations {
  search_count?: number
  vendor_count?: number
}

// Removed vendor route service interfaces as table no longer exists

export interface RouteFilters {
  search?: string
  originLocationId?: string
  destinationLocationId?: string
  isActive?: boolean | 'all'
  isPopular?: boolean | 'all'
  isShared?: boolean | 'all'
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

export interface RouteFormData {
  origin_location_id: string
  destination_location_id: string
  route_name: string
  route_slug: string
  distance_km: number
  estimated_duration_minutes: number
  is_active: boolean
  is_popular: boolean
}

export interface PopularRoute {
  route_id: string
  route_name: string
  route_slug: string
  origin_name: string
  destination_name: string
  search_count: number
  base_price: number
}

export interface RouteSearchParams {
  originLocationId: string
  destinationLocationId: string
  date?: Date
  time?: string
  passengers?: number
}

// Removed route vehicle type pricing interfaces as table no longer exists