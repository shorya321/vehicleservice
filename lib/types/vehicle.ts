import { Database } from '@/lib/supabase/types'

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type VehicleType = Database['public']['Tables']['vehicle_types']['Row']
export type VehicleTypeInsert = Database['public']['Tables']['vehicle_types']['Insert']
export type VehicleTypeUpdate = Database['public']['Tables']['vehicle_types']['Update']

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'
export type TransmissionType = 'manual' | 'automatic'

export interface VehicleFormData {
  make: string
  model: string
  year: number
  registration_number: string
  vehicle_type_id?: string
  fuel_type?: FuelType
  transmission?: TransmissionType
  seats?: number
  luggage_capacity?: number
  is_available: boolean
  feature_ids?: string[]
}

export interface VehicleFilters {
  search?: string
  status?: 'all' | 'available' | 'unavailable'
  vehicleTypeId?: string | 'all'
  categoryId?: string | 'all'
  fuelType?: FuelType | 'all'
  transmission?: TransmissionType | 'all'
  minSeats?: number
  city?: string
  page?: number
  limit?: number
}

export interface PaginatedVehicles {
  vehicles: Vehicle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VehicleTypeWithCategory extends VehicleType {
  category?: Database['public']['Tables']['vehicle_categories']['Row']
}

export interface VehicleWithType extends Vehicle {
  vehicle_type?: VehicleTypeWithCategory
}

export interface VehicleTypeWithPricing extends VehicleTypeWithCategory {
  price: number
  available_count: number
  vehicle_examples: string[]
}