import { Database } from '@/lib/supabase/types'

export type VehicleCategory = Database['public']['Tables']['vehicle_categories']['Row']
export type VehicleCategoryInsert = Database['public']['Tables']['vehicle_categories']['Insert']
export type VehicleCategoryUpdate = Database['public']['Tables']['vehicle_categories']['Update']