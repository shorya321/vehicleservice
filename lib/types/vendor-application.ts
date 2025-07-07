import { Database } from '@/lib/supabase/types'
import { User } from './user'

export type VendorApplication = Database['public']['Tables']['vendor_applications']['Row']
export type VendorApplicationInsert = Database['public']['Tables']['vendor_applications']['Insert']
export type VendorApplicationUpdate = Database['public']['Tables']['vendor_applications']['Update']

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface VendorApplicationWithUser extends VendorApplication {
  user: User
  reviewer?: User
}

export interface VendorApplicationFormData {
  business_name: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_city?: string
  business_country_code: string
  business_description?: string
}

export interface VendorApplicationFilters {
  search?: string
  status?: ApplicationStatus | 'all'
  page?: number
  limit?: number
}

export interface PaginatedVendorApplications {
  applications: VendorApplicationWithUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}