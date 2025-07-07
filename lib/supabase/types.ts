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
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          timezone: string | null
          type: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          address?: string | null
          allow_dropoff?: boolean | null
          allow_pickup?: boolean | null
          city?: string | null
          country_code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          timezone?: string | null
          type: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          address?: string | null
          allow_dropoff?: boolean | null
          allow_pickup?: boolean | null
          city?: string | null
          country_code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
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
      vehicles: {
        Row: {
          business_id: string
          created_at: string
          daily_rate: number
          features: Json | null
          fuel_type: string | null
          gallery_images: Json | null
          id: string
          is_available: boolean | null
          make: string
          model: string
          primary_image_url: string | null
          registration_number: string
          seats: number | null
          transmission: string | null
          updated_at: string
          year: number
        }
        Insert: {
          business_id: string
          created_at?: string
          daily_rate: number
          features?: Json | null
          fuel_type?: string | null
          gallery_images?: Json | null
          id?: string
          is_available?: boolean | null
          make: string
          model: string
          primary_image_url?: string | null
          registration_number: string
          seats?: number | null
          transmission?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          business_id?: string
          created_at?: string
          daily_rate?: number
          features?: Json | null
          fuel_type?: string | null
          gallery_images?: Json | null
          id?: string
          is_available?: boolean | null
          make?: string
          model?: string
          primary_image_url?: string | null
          registration_number?: string
          seats?: number | null
          transmission?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
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