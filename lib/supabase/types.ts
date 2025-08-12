export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          allow_dropoff: boolean | null
          allow_pickup: boolean | null
          city: string | null
          country_code: string
          country_slug: string
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          slug: string
          timezone: string | null
          type: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          address?: string | null
          allow_dropoff?: boolean | null
          allow_pickup?: boolean | null
          city?: string | null
          country_code: string
          country_slug: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          slug: string
          timezone?: string | null
          type: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          address?: string | null
          allow_dropoff?: boolean | null
          allow_pickup?: boolean | null
          city?: string | null
          country_code?: string
          country_slug?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          slug?: string
          timezone?: string | null
          type?: Database["public"]["Enums"]["location_type"]
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          digest_frequency: string | null
          email_booking_updates: boolean | null
          email_new_user_registration: boolean | null
          email_payment_alerts: boolean | null
          email_security_alerts: boolean | null
          email_system_updates: boolean | null
          id: string
          push_booking_updates: boolean | null
          push_enabled: boolean | null
          push_new_user_registration: boolean | null
          push_security_alerts: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_frequency?: string | null
          email_booking_updates?: boolean | null
          email_new_user_registration?: boolean | null
          email_payment_alerts?: boolean | null
          email_security_alerts?: boolean | null
          email_system_updates?: boolean | null
          id?: string
          push_booking_updates?: boolean | null
          push_enabled?: boolean | null
          push_new_user_registration?: boolean | null
          push_security_alerts?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_frequency?: string | null
          email_booking_updates?: boolean | null
          email_new_user_registration?: boolean | null
          email_payment_alerts?: boolean | null
          email_security_alerts?: boolean | null
          email_system_updates?: boolean | null
          id?: string
          push_booking_updates?: boolean | null
          push_enabled?: boolean | null
          push_new_user_registration?: boolean | null
          push_security_alerts?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          email_verified_at: string | null
          full_name: string | null
          id: string
          last_sign_in_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          sign_in_count: number | null
          status: Database["public"]["Enums"]["user_status"]
          two_factor_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          id: string
          last_sign_in_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sign_in_count?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          last_sign_in_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sign_in_count?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      route_searches: {
        Row: {
          destination_location_id: string | null
          id: string
          origin_location_id: string | null
          passenger_count: number
          route_id: string | null
          search_date: string | null
          searched_at: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          destination_location_id?: string | null
          id?: string
          origin_location_id?: string | null
          passenger_count?: number
          route_id?: string | null
          search_date?: string | null
          searched_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          destination_location_id?: string | null
          id?: string
          origin_location_id?: string | null
          passenger_count?: number
          route_id?: string | null
          search_date?: string | null
          searched_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_searches_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_searches_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_searches_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_vehicle_type_pricing: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          price: number
          route_id: string | null
          updated_at: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          route_id?: string | null
          updated_at?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          route_id?: string | null
          updated_at?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_vehicle_type_pricing_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_vehicle_type_pricing_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          base_price: number
          created_at: string | null
          created_by: string | null
          created_by_type: string | null
          destination_location_id: string
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_shared: boolean | null
          origin_location_id: string
          route_name: string
          route_slug: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          destination_location_id: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_shared?: boolean | null
          origin_location_id: string
          route_name: string
          route_slug: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          created_by?: string | null
          created_by_type?: string | null
          destination_location_id?: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_shared?: boolean | null
          origin_location_id?: string
          route_name?: string
          route_slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_feature_mappings: {
        Row: {
          created_at: string | null
          feature_id: string
          id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          feature_id: string
          id?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          feature_id?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_feature_mappings_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "vehicle_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_feature_mappings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_features: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          luggage_capacity: number | null
          name: string
          passenger_capacity: number
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          luggage_capacity?: number | null
          name: string
          passenger_capacity: number
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          luggage_capacity?: number | null
          name?: string
          passenger_capacity?: number
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          business_id: string
          category_id: string | null
          created_at: string
          fuel_type: string | null
          gallery_images: Json | null
          id: string
          is_available: boolean | null
          luggage_capacity: number | null
          make: string
          model: string
          primary_image_url: string | null
          registration_number: string
          seats: number | null
          transmission: string | null
          updated_at: string
          vehicle_type_id: string | null
          year: number
        }
        Insert: {
          business_id: string
          category_id?: string | null
          created_at?: string
          fuel_type?: string | null
          gallery_images?: Json | null
          id?: string
          is_available?: boolean | null
          luggage_capacity?: number | null
          make: string
          model: string
          primary_image_url?: string | null
          registration_number: string
          seats?: number | null
          transmission?: string | null
          updated_at?: string
          vehicle_type_id?: string | null
          year: number
        }
        Update: {
          business_id?: string
          category_id?: string | null
          created_at?: string
          fuel_type?: string | null
          gallery_images?: Json | null
          id?: string
          is_available?: boolean | null
          luggage_capacity?: number | null
          make?: string
          model?: string
          primary_image_url?: string | null
          registration_number?: string
          seats?: number | null
          transmission?: string | null
          updated_at?: string
          vehicle_type_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicle_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_applications: {
        Row: {
          admin_notes: string | null
          banking_details: Json | null
          business_address: string | null
          business_city: string | null
          business_country_code: string | null
          business_description: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          created_at: string
          documents: Json | null
          id: string
          registration_number: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          banking_details?: Json | null
          business_address?: string | null
          business_city?: string | null
          business_country_code?: string | null
          business_description?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          banking_details?: Json | null
          business_address?: string | null
          business_city?: string | null
          business_country_code?: string | null
          business_description?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          registration_number?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_route_services: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          route_id: string
          service_features: Json | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          route_id: string
          service_features?: Json | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          route_id?: string
          service_features?: Json | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_route_services_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_route_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_vendor_application: {
        Args: { p_application_id: string; p_admin_notes?: string }
        Returns: Json
      }
      cleanup_expired_verification_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_location_hierarchy: {
        Args: { city_id: string }
        Returns: Json
      }
      get_or_create_notification_preferences: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          digest_frequency: string | null
          email_booking_updates: boolean | null
          email_new_user_registration: boolean | null
          email_payment_alerts: boolean | null
          email_security_alerts: boolean | null
          email_system_updates: boolean | null
          id: string
          push_booking_updates: boolean | null
          push_enabled: boolean | null
          push_new_user_registration: boolean | null
          push_security_alerts: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
      }
      get_popular_routes: {
        Args: { limit_count?: number; days_back?: number }
        Returns: {
          route_id: string
          route_name: string
          route_slug: string
          origin_name: string
          destination_name: string
          search_count: number
          base_price: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      reject_vendor_application: {
        Args: {
          p_application_id: string
          p_rejection_reason: string
          p_admin_notes?: string
        }
        Returns: Json
      }
      user_has_vendor_application: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      verify_email_with_token: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      communication_direction: "inbound" | "outbound"
      communication_status: "sent" | "delivered" | "failed" | "read"
      communication_type: "email" | "sms" | "call" | "push_notification"
      extra_type:
        | "child_seat"
        | "booster_seat"
        | "pet_transport"
        | "extra_wait_time"
        | "meet_greet"
        | "nameplate_service"
        | "premium_water"
        | "newspapers"
        | "phone_charger"
        | "wifi_hotspot"
        | "priority_pickup"
      location_type: "airport" | "city" | "hotel" | "station"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      rule_type: "night" | "holiday" | "peak" | "weekend"
      user_role: "admin" | "customer" | "vendor" | "driver"
      user_status: "active" | "inactive" | "suspended"
      vehicle_status: "active" | "maintenance" | "inactive" | "retired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      communication_direction: ["inbound", "outbound"],
      communication_status: ["sent", "delivered", "failed", "read"],
      communication_type: ["email", "sms", "call", "push_notification"],
      extra_type: [
        "child_seat",
        "booster_seat",
        "pet_transport",
        "extra_wait_time",
        "meet_greet",
        "nameplate_service",
        "premium_water",
        "newspapers",
        "phone_charger",
        "wifi_hotspot",
        "priority_pickup",
      ],
      location_type: ["airport", "city", "hotel", "station"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      rule_type: ["night", "holiday", "peak", "weekend"],
      user_role: ["admin", "customer", "vendor", "driver"],
      user_status: ["active", "inactive", "suspended"],
      vehicle_status: ["active", "maintenance", "inactive", "retired"],
    },
  },
} as const