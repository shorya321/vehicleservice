import { Database } from '@/lib/supabase/types'
import { User } from './user'

export type VendorApplication = Database['public']['Tables']['vendor_applications']['Row']
export type VendorApplicationInsert = Database['public']['Tables']['vendor_applications']['Insert']
export type VendorApplicationUpdate = Database['public']['Tables']['vendor_applications']['Update']

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

export interface VendorProfileFormData {
  business_name: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_city?: string
  business_country_code: string
  business_description?: string
  registration_number: string
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

export interface VendorApplicationFilters {
  search?: string
  status?: 'pending' | 'approved' | 'rejected' | 'all'
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