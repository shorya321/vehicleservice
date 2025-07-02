export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'customer' | 'vendor' | 'driver'
          phone: string | null
          status: 'active' | 'inactive' | 'suspended'
          email_verified: boolean
          email_verified_at: string | null
          two_factor_enabled: boolean
          last_sign_in_at: string | null
          sign_in_count: number
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'admin' | 'customer' | 'vendor' | 'driver'
          phone?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          email_verified?: boolean
          email_verified_at?: string | null
          two_factor_enabled?: boolean
          last_sign_in_at?: string | null
          sign_in_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'customer' | 'vendor' | 'driver'
          phone?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          email_verified?: boolean
          email_verified_at?: string | null
          two_factor_enabled?: boolean
          last_sign_in_at?: string | null
          sign_in_count?: number
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'customer' | 'vendor' | 'driver'
      user_status: 'active' | 'inactive' | 'suspended'
    }
  }
}