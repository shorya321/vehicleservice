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
      account_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          max_quantity: number | null
          name: string
          price: number
          pricing_type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name: string
          price?: number
          pricing_type?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          name?: string
          price?: number
          pricing_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_wallet_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          amount: number | null
          business_account_id: string
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          new_balance: number | null
          previous_balance: number | null
          reason: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          amount?: number | null
          business_account_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          new_balance?: number | null
          previous_balance?: number | null
          reason: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          amount?: number | null
          business_account_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          new_balance?: number | null
          previous_balance?: number | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_wallet_audit_log_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_recharge_attempts: {
        Row: {
          actual_recharged_amount: number | null
          business_account_id: string
          created_at: string
          currency: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          last_retry_at: string | null
          max_retries: number
          next_retry_at: string | null
          payment_method_id: string | null
          processed_at: string | null
          requested_amount: number
          retry_count: number
          status: Database["public"]["Enums"]["auto_recharge_status"]
          stripe_payment_intent_id: string | null
          trigger_balance: number
          trigger_threshold: number
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          actual_recharged_amount?: number | null
          business_account_id: string
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          last_retry_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          requested_amount: number
          retry_count?: number
          status?: Database["public"]["Enums"]["auto_recharge_status"]
          stripe_payment_intent_id?: string | null
          trigger_balance: number
          trigger_threshold: number
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          actual_recharged_amount?: number | null
          business_account_id?: string
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          last_retry_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          requested_amount?: number
          retry_count?: number
          status?: Database["public"]["Enums"]["auto_recharge_status"]
          stripe_payment_intent_id?: string | null
          trigger_balance?: number
          trigger_threshold?: number
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_recharge_attempts_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_recharge_attempts_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_recharge_attempts_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_recharge_settings: {
        Row: {
          business_account_id: string
          created_at: string
          currency: string
          enabled: boolean
          id: string
          max_recharge_per_month: number | null
          payment_method_id: string | null
          recharge_amount: number
          trigger_threshold: number
          updated_at: string
          use_default_payment_method: boolean
        }
        Insert: {
          business_account_id: string
          created_at?: string
          currency?: string
          enabled?: boolean
          id?: string
          max_recharge_per_month?: number | null
          payment_method_id?: string | null
          recharge_amount?: number
          trigger_threshold?: number
          updated_at?: string
          use_default_payment_method?: boolean
        }
        Update: {
          business_account_id?: string
          created_at?: string
          currency?: string
          enabled?: boolean
          id?: string
          max_recharge_per_month?: number | null
          payment_method_id?: string | null
          recharge_amount?: number
          trigger_threshold?: number
          updated_at?: string
          use_default_payment_method?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "auto_recharge_settings_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: true
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_recharge_settings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_amenities: {
        Row: {
          addon_id: string | null
          amenity_type: string
          booking_id: string | null
          created_at: string | null
          id: string
          price: number
          quantity: number | null
        }
        Insert: {
          addon_id?: string | null
          amenity_type: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price: number
          quantity?: number | null
        }
        Update: {
          addon_id?: string | null
          amenity_type?: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          price?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_amenities_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
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
          booking_id: string | null
          business_booking_id: string | null
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
          booking_id?: string | null
          business_booking_id?: string | null
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
          booking_id?: string | null
          business_booking_id?: string | null
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
            foreignKeyName: "booking_assignments_business_booking_id_fkey"
            columns: ["business_booking_id"]
            isOneToOne: false
            referencedRelation: "business_bookings"
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
      booking_datetime_modifications: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          modification_reason: string | null
          modified_by_user_id: string
          new_datetime: string
          previous_datetime: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          modification_reason?: string | null
          modified_by_user_id: string
          new_datetime: string
          previous_datetime: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          modification_reason?: string | null
          modified_by_user_id?: string
          new_datetime?: string
          previous_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_datetime_modifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "business_bookings"
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
      blog_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_post_images: {
        Row: {
          id: string
          post_id: string
          image_url: string
          alt_text: string | null
          caption: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          image_url: string
          alt_text?: string | null
          caption?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          image_url?: string
          alt_text?: string | null
          caption?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          featured_image_url: string | null
          category_id: string | null
          author_id: string | null
          status: "draft" | "published" | "archived" | null
          is_featured: boolean | null
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          published_at: string | null
          reading_time_minutes: number | null
          view_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          featured_image_url?: string | null
          category_id?: string | null
          author_id?: string | null
          status?: "draft" | "published" | "archived" | null
          is_featured?: boolean | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          view_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          featured_image_url?: string | null
          category_id?: string | null
          author_id?: string | null
          status?: "draft" | "published" | "archived" | null
          is_featured?: boolean | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          view_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
        }
        Relationships: []
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
      business_accounts: {
        Row: {
          address: string | null
          brand_name: string | null
          business_email: string
          business_name: string
          business_phone: string | null
          city: string | null
          contact_person_name: string | null
          country_code: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          custom_domain_verified: boolean | null
          custom_domain_verified_at: string | null
          domain_verification_token: string | null
          id: string
          last_low_balance_alert_at: string | null
          last_monthly_statement_at: string | null
          logo_url: string | null
          max_daily_spend: number | null
          max_monthly_spend: number | null
          max_transaction_amount: number | null
          notification_preferences: Json | null
          payment_element_enabled: boolean | null
          preferred_currency: string | null
          save_payment_methods: boolean | null
          spending_limits_enabled: boolean | null
          status: string
          stripe_customer_id: string | null
          subdomain: string
          theme_config: Json | null
          updated_at: string
          wallet_balance: number
          wallet_frozen: boolean | null
          wallet_frozen_at: string | null
          wallet_frozen_by: string | null
          wallet_frozen_reason: string | null
        }
        Insert: {
          address?: string | null
          brand_name?: string | null
          business_email: string
          business_name: string
          business_phone?: string | null
          city?: string | null
          contact_person_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          domain_verification_token?: string | null
          id?: string
          last_low_balance_alert_at?: string | null
          last_monthly_statement_at?: string | null
          logo_url?: string | null
          max_daily_spend?: number | null
          max_monthly_spend?: number | null
          max_transaction_amount?: number | null
          notification_preferences?: Json | null
          payment_element_enabled?: boolean | null
          preferred_currency?: string | null
          save_payment_methods?: boolean | null
          spending_limits_enabled?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          subdomain: string
          theme_config?: Json | null
          updated_at?: string
          wallet_balance?: number
          wallet_frozen?: boolean | null
          wallet_frozen_at?: string | null
          wallet_frozen_by?: string | null
          wallet_frozen_reason?: string | null
        }
        Update: {
          address?: string | null
          brand_name?: string | null
          business_email?: string
          business_name?: string
          business_phone?: string | null
          city?: string | null
          contact_person_name?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          domain_verification_token?: string | null
          id?: string
          last_low_balance_alert_at?: string | null
          last_monthly_statement_at?: string | null
          logo_url?: string | null
          max_daily_spend?: number | null
          max_monthly_spend?: number | null
          max_transaction_amount?: number | null
          notification_preferences?: Json | null
          payment_element_enabled?: boolean | null
          preferred_currency?: string | null
          save_payment_methods?: boolean | null
          spending_limits_enabled?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          subdomain?: string
          theme_config?: Json | null
          updated_at?: string
          wallet_balance?: number
          wallet_frozen?: boolean | null
          wallet_frozen_at?: string | null
          wallet_frozen_by?: string | null
          wallet_frozen_reason?: string | null
        }
        Relationships: []
      }
      business_booking_addons: {
        Row: {
          addon_id: string
          business_booking_id: string
          created_at: string | null
          id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          addon_id: string
          business_booking_id: string
          created_at?: string | null
          id?: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          addon_id?: string
          business_booking_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_booking_addons_business_booking_id_fkey"
            columns: ["business_booking_id"]
            isOneToOne: false
            referencedRelation: "business_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_bookings: {
        Row: {
          applied_multiplier: number | null
          base_price: number
          booking_number: string
          booking_status: string
          business_account_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          created_by_user_id: string
          customer_email: string
          customer_name: string
          customer_notes: string | null
          customer_phone: string
          dropoff_address: string
          from_location_id: string
          id: string
          passenger_count: number
          payment_status: string | null
          pickup_address: string
          pickup_datetime: string
          reference_number: string | null
          to_location_id: string
          total_price: number
          updated_at: string
          vehicle_type_id: string
          wallet_deduction_amount: number
        }
        Insert: {
          applied_multiplier?: number | null
          base_price: number
          booking_number: string
          booking_status?: string
          business_account_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by_user_id: string
          customer_email: string
          customer_name: string
          customer_notes?: string | null
          customer_phone: string
          dropoff_address: string
          from_location_id: string
          id?: string
          passenger_count?: number
          payment_status?: string | null
          pickup_address: string
          pickup_datetime: string
          reference_number?: string | null
          to_location_id: string
          total_price: number
          updated_at?: string
          vehicle_type_id: string
          wallet_deduction_amount: number
        }
        Update: {
          applied_multiplier?: number | null
          base_price?: number
          booking_number?: string
          booking_status?: string
          business_account_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by_user_id?: string
          customer_email?: string
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string
          dropoff_address?: string
          from_location_id?: string
          id?: string
          passenger_count?: number
          payment_status?: string | null
          pickup_address?: string
          pickup_datetime?: string
          reference_number?: string | null
          to_location_id?: string
          total_price?: number
          updated_at?: string
          vehicle_type_id?: string
          wallet_deduction_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_bookings_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "business_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      business_users: {
        Row: {
          auth_user_id: string
          business_account_id: string
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          business_account_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          business_account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_settings: {
        Row: {
          created_at: string | null
          currency_code: string
          decimal_places: number | null
          display_order: number | null
          id: string
          is_default: boolean | null
          is_enabled: boolean | null
          is_featured: boolean | null
          name: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          decimal_places?: number | null
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          is_featured?: boolean | null
          name: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          decimal_places?: number | null
          display_order?: number | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          is_featured?: boolean | null
          name?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
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
      exchange_rates: {
        Row: {
          base_currency: string | null
          created_at: string | null
          fetched_at: string | null
          id: string
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency?: string | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          rate: number
          target_currency: string
        }
        Update: {
          base_currency?: string | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          rate?: number
          target_currency?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_category"]
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          business_account_id: string | null
          created_at: string
          domain: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          business_account_id?: string | null
          created_at?: string
          domain: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          business_account_id?: string | null
          created_at?: string
          domain?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          business_account_id: string
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_funding: string | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_used_at: string | null
          payment_method_type: string
          stripe_payment_method_id: string
          updated_at: string | null
        }
        Insert: {
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          business_account_id: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_funding?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          payment_method_type: string
          stripe_payment_method_id: string
          updated_at?: string | null
        }
        Update: {
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          business_account_id?: string
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_funding?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          payment_method_type?: string
          stripe_payment_method_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_business_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_street: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
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
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
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
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
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
          business_price_multiplier: number | null
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
          business_price_multiplier?: number | null
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
          business_price_multiplier?: number | null
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
      wallet_monthly_statements: {
        Row: {
          business_account_id: string
          closing_balance: number
          created_at: string | null
          email_sent_at: string | null
          email_status: string | null
          id: string
          opening_balance: number
          pdf_generated_at: string | null
          pdf_url: string | null
          statement_month: number
          statement_year: number
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          business_account_id: string
          closing_balance: number
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          opening_balance: number
          pdf_generated_at?: string | null
          pdf_url?: string | null
          statement_month: number
          statement_year: number
          total_credits?: number | null
          total_debits?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          business_account_id?: string
          closing_balance?: number
          created_at?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          id?: string
          opening_balance?: number
          pdf_generated_at?: string | null
          pdf_url?: string | null
          statement_month?: number
          statement_year?: number
          total_credits?: number | null
          total_debits?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_monthly_statements_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_notification_history: {
        Row: {
          body: string | null
          business_account_id: string
          channel: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          next_retry_at: string | null
          notification_type: string
          recipient_email: string | null
          recipient_phone: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          business_account_id: string
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          notification_type: string
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          business_account_id?: string
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          notification_type?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_notification_history_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          business_account_id: string
          created_at: string
          created_by: string
          currency: string | null
          description: string
          exchange_rate: number | null
          id: string
          metadata: Json | null
          original_amount: number | null
          original_currency: string | null
          reference_id: string | null
          stripe_payment_intent_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          business_account_id: string
          created_at?: string
          created_by: string
          currency?: string | null
          description: string
          exchange_rate?: number | null
          id?: string
          metadata?: Json | null
          original_amount?: number | null
          original_currency?: string | null
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          business_account_id?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string
          exchange_rate?: number | null
          id?: string
          metadata?: Json | null
          original_amount?: number | null
          original_currency?: string | null
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
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
      auto_recharge_monthly_spending: {
        Row: {
          business_account_id: string | null
          failed_count: number | null
          month: string | null
          recharge_count: number | null
          successful_count: number | null
          total_recharged: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_recharge_attempts_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_transaction_summary: {
        Row: {
          avg_transaction: number | null
          business_account_id: string | null
          currency: string | null
          day: string | null
          net_amount: number | null
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_transaction_summary: {
        Row: {
          admin_adjustment_count: number | null
          avg_transaction: number | null
          booking_deduction_count: number | null
          business_account_id: string | null
          credit_added_count: number | null
          currency: string | null
          month: string | null
          net_amount: number | null
          refund_count: number | null
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_to_wallet: {
        Args: {
          p_amount: number
          p_business_id: string
          p_created_by?: string
          p_description: string
          p_reference_id?: string
          p_stripe_payment_intent_id?: string
          p_transaction_type: string
        }
        Returns: number
      }
      admin_adjust_wallet: {
        Args: {
          p_admin_user_id: string
          p_amount: number
          p_business_account_id: string
          p_currency?: string
          p_reason: string
        }
        Returns: Json
      }
      approve_vendor_application: {
        Args: { p_admin_notes?: string; p_application_id: string }
        Returns: Json
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      cancel_business_booking_with_refund: {
        Args: { p_booking_id: string; p_cancellation_reason: string }
        Returns: {
          new_balance: number
          refund_amount: number
        }[]
      }
      check_low_balance_alert: {
        Args: { p_business_account_id: string }
        Returns: {
          current_balance: number
          last_alert_sent_at: string
          should_send: boolean
          threshold: number
        }[]
      }
      check_monthly_auto_recharge_limit: {
        Args: { p_business_account_id: string; p_new_amount: number }
        Returns: boolean
      }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: number }
      cleanup_expired_verification_tokens: { Args: never; Returns: number }
      convert_currency: {
        Args: {
          p_amount: number
          p_from_currency?: string
          p_to_currency?: string
        }
        Returns: number
      }
      create_admin_notification: {
        Args: {
          p_category: Database["public"]["Enums"]["notification_category"]
          p_data?: Json
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      create_booking_with_wallet_deduction: {
        Args: {
          p_base_price: number
          p_business_id: string
          p_created_by_user_id: string
          p_customer_email: string
          p_customer_name: string
          p_customer_notes?: string
          p_customer_phone: string
          p_dropoff_address: string
          p_from_location_id: string
          p_passenger_count: number
          p_pickup_address: string
          p_pickup_datetime: string
          p_reference_number?: string
          p_to_location_id: string
          p_total_price: number
          p_vehicle_type_id: string
        }
        Returns: string
      }
      create_business_notification: {
        Args: {
          p_business_user_auth_id: string
          p_category: Database["public"]["Enums"]["notification_category"]
          p_data?: Json
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      create_customer_notification: {
        Args: {
          p_category: Database["public"]["Enums"]["notification_category"]
          p_data?: Json
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_vendor_notification: {
        Args: {
          p_category: Database["public"]["Enums"]["notification_category"]
          p_data?: Json
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_vendor_app_id: string
        }
        Returns: undefined
      }
      decrypt_stripe_access_token: {
        Args: { p_business_account_id: string }
        Returns: string
      }
      decrypt_stripe_refresh_token: {
        Args: { p_business_account_id: string }
        Returns: string
      }
      deduct_from_wallet: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_business_account_id: string
          p_currency?: string
          p_description: string
        }
        Returns: Json
      }
      disconnect_stripe_account: {
        Args: { p_business_account_id: string }
        Returns: undefined
      }
      encrypt_and_store_stripe_tokens: {
        Args: {
          p_access_token: string
          p_business_account_id: string
          p_connected_account_id: string
          p_refresh_token: string
        }
        Returns: undefined
      }
      export_transactions: {
        Args: {
          p_business_account_id: string
          p_currency?: string
          p_end_date?: string
          p_limit?: number
          p_start_date?: string
          p_transaction_types?: string[]
        }
        Returns: {
          amount: number
          balance_after: number
          created_by: string
          currency: string
          description: string
          exchange_rate: number
          original_amount: number
          original_currency: string
          reference_id: string
          stripe_payment_intent_id: string
          transaction_date: string
          transaction_id: string
          transaction_type: string
        }[]
      }
      freeze_business_wallet: {
        Args: {
          p_admin_user_id: string
          p_business_account_id: string
          p_reason: string
        }
        Returns: Json
      }
      generate_auto_recharge_idempotency_key: {
        Args: { p_business_account_id: string }
        Returns: string
      }
      generate_booking_number: { Args: never; Returns: string }
      generate_monthly_statement_data: {
        Args: { p_business_account_id: string; p_month: number; p_year: number }
        Returns: {
          closing_balance: number
          opening_balance: number
          total_credits: number
          total_debits: number
          transaction_count: number
        }[]
      }
      get_admin_audit_log: {
        Args: {
          p_action_types?: string[]
          p_admin_user_id?: string
          p_business_account_id?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_start_date?: string
        }
        Returns: {
          action_type: string
          admin_email: string
          admin_user_id: string
          amount: number
          business_account_id: string
          business_name: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          new_balance: number
          previous_balance: number
          reason: string
        }[]
      }
      get_admin_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_business_booking_counts: {
        Args: never
        Returns: {
          business_account_id: string
          total_bookings: number
        }[]
      }
      get_business_by_custom_domain: {
        Args: { p_domain: string }
        Returns: {
          brand_name: string
          business_name: string
          custom_domain: string
          id: string
          logo_url: string
          subdomain: string
          theme_config: Json
        }[]
      }
      get_business_payment_methods: {
        Args: { p_business_id: string }
        Returns: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last4: string
          id: string
          is_default: boolean
          last_used_at: string
          payment_method_type: string
          stripe_payment_method_id: string
        }[]
      }
      get_business_user_by_email: {
        Args: { p_email: string }
        Returns: {
          auth_user_id: string
          business_account_id: string
          custom_domain: string
          status: string
          subdomain: string
        }[]
      }
      get_default_currency: { Args: never; Returns: string }
      get_default_payment_method: {
        Args: { p_business_id: string }
        Returns: {
          card_brand: string
          card_last4: string
          id: string
          payment_method_type: string
          stripe_payment_method_id: string
        }[]
      }
      get_enabled_currencies: {
        Args: never
        Returns: {
          currency_code: string
          decimal_places: number
          display_order: number
          is_default: boolean
          name: string
          symbol: string
        }[]
      }
      get_exchange_rate: {
        Args: { p_from_currency?: string; p_to_currency?: string }
        Returns: number
      }
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
      get_locations_with_booking_counts: {
        Args: never
        Returns: {
          booking_count: number
          city: string
          country_code: string
          id: string
          name: string
          type: Database["public"]["Enums"]["location_type"]
        }[]
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
        SetofOptions: {
          from: "*"
          to: "notification_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pending_reviews_count: { Args: never; Returns: number }
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
        Args: never
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
      get_transaction_statistics: {
        Args: {
          p_business_account_id: string
          p_currency?: string
          p_end_date?: string
          p_max_amount?: number
          p_min_amount?: number
          p_start_date?: string
          p_transaction_types?: string[]
        }
        Returns: Json
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
      get_vendor_user_id: { Args: { p_vendor_app_id: string }; Returns: string }
      increment_auto_recharge_retry: {
        Args: { p_attempt_id: string; p_error_message?: string }
        Returns: boolean
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
      mark_all_notifications_read: {
        Args: {
          p_category?: Database["public"]["Enums"]["notification_category"]
          p_user_id: string
        }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      record_wallet_notification: {
        Args: {
          p_body?: string
          p_business_account_id: string
          p_channel: string
          p_metadata?: Json
          p_notification_type: string
          p_recipient_email?: string
          p_subject?: string
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
      search_transactions: {
        Args: {
          p_business_account_id: string
          p_limit?: number
          p_search_query: string
        }
        Returns: {
          amount: number
          balance_after: number
          currency: string
          description: string
          rank: number
          transaction_date: string
          transaction_id: string
          transaction_type: string
        }[]
      }
      set_spending_limits: {
        Args: {
          p_admin_user_id: string
          p_business_account_id: string
          p_enabled?: boolean
          p_max_daily_spend?: number
          p_max_monthly_spend?: number
          p_max_transaction_amount?: number
          p_reason?: string
        }
        Returns: Json
      }
      unfreeze_business_wallet: {
        Args: {
          p_admin_user_id: string
          p_business_account_id: string
          p_reason: string
        }
        Returns: Json
      }
      update_auto_recharge_attempt_status: {
        Args: {
          p_actual_amount?: number
          p_attempt_id: string
          p_error_code?: string
          p_error_message?: string
          p_payment_intent_id?: string
          p_status: Database["public"]["Enums"]["auto_recharge_status"]
          p_wallet_transaction_id?: string
        }
        Returns: boolean
      }
      update_last_low_balance_alert: {
        Args: { p_business_account_id: string }
        Returns: boolean
      }
      update_notification_status: {
        Args: {
          p_error_message?: string
          p_notification_id: string
          p_status: string
        }
        Returns: boolean
      }
      user_has_vendor_application: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      verify_email_with_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      blog_post_status: "draft" | "published" | "archived"
      auto_recharge_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
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
      notification_category:
        | "booking"
        | "user"
        | "vendor_application"
        | "review"
        | "payment"
        | "system"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      review_status: "pending" | "approved" | "rejected"
      rule_type: "night" | "holiday" | "peak" | "weekend"
      user_role: "admin" | "customer" | "vendor" | "driver" | "business"
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
      auto_recharge_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
      ],
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
      notification_category: [
        "booking",
        "user",
        "vendor_application",
        "review",
        "payment",
        "system",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      review_status: ["pending", "approved", "rejected"],
      rule_type: ["night", "holiday", "peak", "weekend"],
      user_role: ["admin", "customer", "vendor", "driver", "business"],
      user_status: ["active", "inactive", "suspended"],
      vehicle_status: ["active", "maintenance", "inactive", "retired"],
    },
  },
} as const

