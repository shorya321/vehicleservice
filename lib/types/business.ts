import { Database } from '@/lib/supabase/types'

export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row']
export type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert']
export type BusinessProfileUpdate = Database['public']['Tables']['business_profiles']['Update']

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export type AvailableVehicleWithBusiness = Database['public']['Views']['available_vehicles_with_business']['Row']

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'
export type TransmissionType = 'manual' | 'automatic'

export interface BusinessFormData {
  business_name: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_city?: string
  business_country_code: string
  business_description?: string
  registration_number: string
  operating_hours?: OperatingHours
  // Documents
  trade_license_number?: string
  trade_license_expiry?: string
  insurance_policy_number?: string
  insurance_expiry?: string
  // Banking details
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  iban?: string
  swift_code?: string
}

export interface VehicleFormData {
  make: string
  model: string
  year: number
  registration_number: string
  daily_rate: number
  fuel_type?: FuelType
  transmission?: TransmissionType
  seats?: number
  features?: string[]
  is_available: boolean
}

export interface OperatingHours {
  [key: string]: {
    open: string
    close: string
    closed?: boolean
  }
}

export interface VehicleFilters {
  search?: string
  minPrice?: number
  maxPrice?: number
  fuelType?: FuelType | 'all'
  transmission?: TransmissionType | 'all'
  seats?: number
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