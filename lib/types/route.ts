import { Database } from '@/lib/supabase/types'
import { Location } from './location'
import { VendorApplication } from './vendor-application'
import { VehicleTypeWithCategory } from './vehicle'

export type Route = Database['public']['Tables']['routes']['Row']
export type RouteInsert = Database['public']['Tables']['routes']['Insert']
export type RouteUpdate = Database['public']['Tables']['routes']['Update']

export type RouteSearch = Database['public']['Tables']['route_searches']['Row']
export type RouteSearchInsert = Database['public']['Tables']['route_searches']['Insert']

export type VendorRouteService = Database['public']['Tables']['vendor_route_services']['Row']
export type VendorRouteServiceInsert = Database['public']['Tables']['vendor_route_services']['Insert']
export type VendorRouteServiceUpdate = Database['public']['Tables']['vendor_route_services']['Update']

export type RouteVehicleTypePricing = Database['public']['Tables']['route_vehicle_type_pricing']['Row']
export type RouteVehicleTypePricingInsert = Database['public']['Tables']['route_vehicle_type_pricing']['Insert']
export type RouteVehicleTypePricingUpdate = Database['public']['Tables']['route_vehicle_type_pricing']['Update']

export interface RouteWithLocations extends Route {
  origin_location: Location
  destination_location: Location
}

export interface RouteWithDetails extends RouteWithLocations {
  search_count?: number
  vendor_count?: number
}

export interface VendorRouteServiceWithRoute extends VendorRouteService {
  route: RouteWithLocations
}

export interface VendorRouteServiceWithVendor extends VendorRouteService {
  vendor: VendorApplication
}

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
  base_price: number
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

export interface RouteVehicleTypePricingWithType extends RouteVehicleTypePricing {
  vehicle_type: VehicleTypeWithCategory
}

export interface RouteWithVehicleTypes extends RouteWithLocations {
  vehicle_types: RouteVehicleTypePricingWithType[]
}