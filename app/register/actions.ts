"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface RegisterData {
  full_name: string
  email: string
  password: string
  phone: string
}

export async function registerUser(data: RegisterData) {
  try {
    // Use regular client for registration
    const supabase = await createClient()
    
    // Use admin client to create user with email confirmation
    const adminClient = await createAdminClient()
    
    // First, create the user with admin client to auto-confirm email
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email in development
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone
      }
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      
      // Handle specific error cases
      if (authError.message.includes("already registered")) {
        return { error: "An account with this email already exists" }
      }
      
      return { error: authError.message || "Failed to create account" }
    }

    if (!authData.user) {
      return { error: "Failed to create user account" }
    }

    // Create or update profile with customer role    
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: 'customer', // Default role
        status: 'active', // Default status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      
      // If profile creation fails, we should clean up the auth user
      // But for now, we'll just log the error
      return { error: "Account created but profile setup failed. Please contact support." }
    }

    return { 
      success: true,
      message: "Account created successfully! Please check your email to verify your account."
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "An unexpected error occurred during registration" }
  }
}