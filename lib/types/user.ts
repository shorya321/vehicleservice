import { Database } from '@/lib/supabase/types'

export type User = Database['public']['Tables']['profiles']['Row']
export type UserInsert = Database['public']['Tables']['profiles']['Insert']
export type UserUpdate = Database['public']['Tables']['profiles']['Update']
export type UserRole = Database['public']['Enums']['user_role']
export type UserStatus = Database['public']['Enums']['user_status']

export interface UserWithAuth extends User {
  auth_id?: string
  last_sign_in?: string
}

export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  page?: number
  limit?: number
}

export interface UserFormData {
  email: string
  full_name: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
}

export type PasswordOption = 'generate' | 'custom' | 'reset_link'

export interface CreateUserData extends UserFormData {
  password?: string
  password_option: PasswordOption
  send_welcome_email?: boolean
}

export interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}