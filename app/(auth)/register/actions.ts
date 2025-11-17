"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendWelcomeEmail } from "@/lib/email/services/auth-emails"
import { sendNewUserNotificationEmail } from "@/lib/email/services/admin-emails"
import { getAppUrl, getAdminEmail } from "@/lib/email/config"
import { randomBytes } from "crypto"

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
    
    // First, create the user with admin client
    // Note: Set email_confirm to false to require email verification
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone,
        email_verified: false
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

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // Store verification token in database
    const { error: tokenError } = await adminClient
      .from('email_verification_tokens')
      .insert({
        user_id: authData.user.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error("Token creation error:", tokenError)
      // Continue anyway - user can request new verification email
    }

    // Send welcome email with verification link
    const appUrl = getAppUrl()
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`

    const emailResult = await sendWelcomeEmail({
      email: data.email,
      name: data.full_name,
      verificationUrl,
    })

    if (!emailResult.success) {
      console.error("Failed to send welcome email:", emailResult.error)
      // Don't fail registration if email fails - user can request new verification email
    }

    // Send admin notification
    const adminEmail = getAdminEmail()
    const adminNotificationResult = await sendNewUserNotificationEmail({
      adminEmail,
      userId: authData.user.id,
      userName: data.full_name,
      userEmail: data.email,
      userPhone: data.phone,
      registrationDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      userDetailsUrl: `${getAppUrl()}/admin/users/${authData.user.id}`,
    })

    if (!adminNotificationResult.success) {
      console.error("Failed to send admin notification:", adminNotificationResult.error)
      // Don't fail registration if admin notification fails
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