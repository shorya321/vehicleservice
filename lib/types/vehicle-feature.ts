import { Database } from '@/lib/supabase/types'

// Base types from database
export type VehicleFeature = Database['public']['Tables']['vehicle_features']['Row']
export type VehicleFeatureInsert = Database['public']['Tables']['vehicle_features']['Insert']
export type VehicleFeatureUpdate = Database['public']['Tables']['vehicle_features']['Update']

export type VehicleFeatureMapping = Database['public']['Tables']['vehicle_feature_mappings']['Row']
export type VehicleFeatureMappingInsert = Database['public']['Tables']['vehicle_feature_mappings']['Insert']
export type VehicleFeatureMappingUpdate = Database['public']['Tables']['vehicle_feature_mappings']['Update']

// Feature categories
export type FeatureCategory = 'comfort' | 'safety' | 'technology' | 'entertainment' | 'convenience' | 'performance'

// Extended types
export interface VehicleFeatureWithCount extends VehicleFeature {
  vehicle_count?: number
}

// Form data for creating/updating features
export interface VehicleFeatureFormData {
  name: string
  slug: string
  icon?: string
  category?: FeatureCategory
  description?: string
  sort_order?: number
  is_active: boolean
}

// For displaying vehicles with their features
export interface VehicleWithFeatures {
  id: string
  features: VehicleFeature[]
}

// For feature selection in forms
export interface FeatureSelectionItem {
  id: string
  name: string
  category: FeatureCategory
  icon?: string
  selected: boolean
}

// Grouped features by category for UI
export interface GroupedFeatures {
  category: FeatureCategory
  features: VehicleFeature[]
}

// Feature management filters
export interface VehicleFeatureFilters {
  search?: string
  category?: FeatureCategory | 'all'
  is_active?: boolean | 'all'
  page?: number
  limit?: number
}

export interface PaginatedVehicleFeatures {
  features: VehicleFeature[]
  total: number
  page: number
  limit: number
  totalPages: number
}