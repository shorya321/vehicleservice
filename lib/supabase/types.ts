export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      booking_amenities: {
        Row: {
          amenity_type: string
          booking_id: string | null
          created_at: string | null
          id: string
          price: number
          quantity: number | null
        }
        Insert: {
          amenity_type: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price: number
          quantity?: number | null
        }
        Update: {
          amenity_type?: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_amenities_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          assigned_by: string | null
          booking_id: string
          completed_at: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          notes: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
          vehicle_id: string | null
          vendor_id: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          booking_id: string
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          booking_id?: string
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "vendor_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_passengers: {
        Row: {
          booking_id: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          phone: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          phone?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amenities_price: number | null
          base_price: number
          booking_number: string
          booking_status: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          customer_notes: string | null
          dropoff_address: string
          from_location_id: string | null
          from_zone_id: string | null
          id: string
          luggage_count: number | null
          paid_at: string | null
          passenger_count: number
          payment_error: string | null
          payment_method_details: Json | null
          payment_status: string | null
          pickup_address: string
          pickup_datetime: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          to_location_id: string | null
          to_zone_id: string | null
          total_price: number
          updated_at: string | null
          vehicle_type_id: string
        }
        Insert: {
          amenities_price?: number | null
          base_price: number
          booking_number: string
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          dropoff_address: string
          from_location_id?: string | null
          from_zone_id?: string | null
          id?: string
          luggage_count?: number | null
          paid_at?: string | null
          passenger_count?: number
          payment_error?: string | null
          payment_method_details?: Json | null
          payment_status?: string | null
          pickup_address: string
          pickup_datetime: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          to_location_id?: string | null
          to_zone_id?: string | null
          total_price: number
          updated_at?: string | null
          vehicle_type_id: string
        }
        Update: {
          amenities_price?: number | null
          base_price?: number
          booking_number?: string
          booking_status?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          dropoff_address?: string
          from_location_id?: string | null
          from_zone_id?: string | null
          id?: string
          luggage_count?: number | null
          paid_at?: string | null
          passenger_count?: number
          payment_error?: string | null
          payment_method_details?: Json | null
          payment_status?: string | null
          pickup_address?: string
          pickup_datetime?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          to_location_id?: string | null
          to_zone_id?: string | null
          total_price?: number
          updated_at?: string | null
          vehicle_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_from_zone_id_fkey"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_to_zone_id_fkey"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
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
          zone_id: string | null
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
          zone_id?: string | null
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
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
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
          stripe_customer_id: string | null
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
          stripe_customer_id?: string | null
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
          stripe_customer_id?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      resource_schedules: {
        Row: {
          booking_assignment_id: string | null
          created_at: string | null
          end_datetime: string
          id: string
          resource_id: string
          resource_type: string
          start_datetime: string
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          booking_assignment_id?: string | null
          created_at?: string | null
          end_datetime: string
          id?: string
          resource_id: string
          resource_type: string
          start_datetime: string
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          booking_assignment_id?: string | null
          created_at?: string | null
          end_datetime?: string
          id?: string
          resource_id?: string
          resource_type?: string
          start_datetime?: string
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_schedules_booking_assignment_id_fkey"
            columns: ["booking_assignment_id"]
            isOneToOne: false
            referencedRelation: "booking_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_schedules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_unavailability: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_datetime: string
          id: string
          notes: string | null
          reason: string
          resource_id: string
          resource_type: string
          start_datetime: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_datetime: string
          id?: string
          notes?: string | null
          reason: string
          resource_id: string
          resource_type: string
          start_datetime: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_datetime?: string
          id?: string
          notes?: string | null
          reason?: string
          resource_id?: string
          resource_type?: string
          start_datetime?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_unavailability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_unavailability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_responder_id: string | null
          admin_response: string | null
          admin_response_at: string | null
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          is_featured: boolean
          photos: string[] | null
          rating: number
          review_text: string | null
          route_from: string | null
          route_to: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          vehicle_class: string | null
        }
        Insert: {
          admin_responder_id?: string | null
          admin_response?: string | null
          admin_response_at?: string | null
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_featured?: boolean
          photos?: string[] | null
          rating: number
          review_text?: string | null
          route_from?: string | null
          route_to?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          vehicle_class?: string | null
        }
        Update: {
          admin_responder_id?: string | null
          admin_response?: string | null
          admin_response_at?: string | null
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_featured?: boolean
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          route_from?: string | null
          route_to?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          vehicle_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_admin_responder_id_fkey"
            columns: ["admin_responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          destination_location_id: string
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          origin_location_id: string
          route_name: string
          route_slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          destination_location_id: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          origin_location_id: string
          route_name: string
          route_slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          destination_location_id?: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          origin_location_id?: string
          route_name?: string
          route_slug?: string
          updated_at?: string | null
        }
        Relationships: [
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
      theme_settings: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
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
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
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
          price_multiplier: number | null
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
          price_multiplier?: number | null
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
          price_multiplier?: number | null
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
      vendor_drivers: {
        Row: {
          address: string | null
          city: string | null
          country_code: string | null
          created_at: string | null
          date_of_birth: string | null
          documents: Json | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_status: string | null
          first_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          joining_date: string | null
          last_name: string
          license_expiry: string
          license_number: string
          license_type: string | null
          notes: string | null
          phone: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          joining_date?: string | null
          last_name: string
          license_expiry: string
          license_number: string
          license_type?: string | null
          notes?: string | null
          phone: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_status?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          joining_date?: string | null
          last_name?: string
          license_expiry?: string
          license_number?: string
          license_type?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_drivers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_pricing: {
        Row: {
          base_price: number
          created_at: string | null
          currency: string | null
          from_zone_id: string
          id: string
          is_active: boolean | null
          to_zone_id: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          created_at?: string | null
          currency?: string | null
          from_zone_id: string
          id?: string
          is_active?: boolean | null
          to_zone_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          currency?: string | null
          from_zone_id?: string
          id?: string
          is_active?: boolean | null
          to_zone_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_pricing_from_zone_id_fkey"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_pricing_to_zone_id_fkey"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_vendor_application: {
        Args: { p_admin_notes?: string; p_application_id: string }
        Returns: Json
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      cleanup_expired_verification_tokens: { Args: Record<PropertyKey, never>; Returns: number }
      get_featured_reviews: {
        Args: { p_limit?: number }
        Returns: {
          admin_responder_id: string | null
          admin_response: string | null
          admin_response_at: string | null
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          is_featured: boolean
          photos: string[] | null
          rating: number
          review_text: string | null
          route_from: string | null
          route_to: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          vehicle_class: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_location_hierarchy: { Args: { city_id: string }; Returns: Json }
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
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pending_reviews_count: { Args: Record<PropertyKey, never>; Returns: number }
      get_popular_routes: {
        Args: { limit_count?: number }
        Returns: {
          destination_city: string
          destination_location_id: string
          destination_name: string
          distance_km: number
          estimated_duration_minutes: number
          id: string
          origin_city: string
          origin_location_id: string
          origin_name: string
          route_slug: string
        }[]
      }
      get_review_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_rating: number
          rating_1_count: number
          rating_1_percent: number
          rating_2_count: number
          rating_2_percent: number
          rating_3_count: number
          rating_3_percent: number
          rating_4_count: number
          rating_4_percent: number
          rating_5_count: number
          rating_5_percent: number
          total_reviews: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_vehicle_type_rating: {
        Args: { p_vehicle_type_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      log_user_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      reject_vendor_application: {
        Args: {
          p_admin_notes?: string
          p_application_id: string
          p_rejection_reason: string
        }
        Returns: Json
      }
      user_has_vendor_application: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      verify_email_with_token: { Args: { p_token: string }; Returns: Json }
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
      review_status: "pending" | "approved" | "rejected"
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
      review_status: ["pending", "approved", "rejected"],
      rule_type: ["night", "holiday", "peak", "weekend"],
      user_role: ["admin", "customer", "vendor", "driver"],
      user_status: ["active", "inactive", "suspended"],
      vehicle_status: ["active", "maintenance", "inactive", "retired"],
    },
  },
} as const
