"use server"

import { createServerActionClient } from "@/lib/supabase/server-actions"
import { redirect } from "next/navigation"

export async function userLogin(email: string, password: string) {
  const supabase = await createServerActionClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Login failed. Please try again." }
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile lookup error:", profileError)
    await supabase.auth.signOut()
    return { error: "Unable to verify user profile." }
  }

  // Check if user is active
  if (profile.status !== 'active') {
    await supabase.auth.signOut()
    return { error: "Your account is inactive. Please contact support." }
  }

  // Check if user role is allowed (not admin)
  const allowedRoles = ['customer', 'vendor']
  if (!allowedRoles.includes(profile.role)) {
    await supabase.auth.signOut()
    if (profile.role === 'admin') {
      return { error: "Please use the admin login page at /admin/login" }
    }
    return { error: "Invalid user role. Access denied." }
  }

  // Success - return role for client-side redirect
  return { 
    success: true,
    role: profile.role
  }
}