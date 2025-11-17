"use server"

import { createServerActionClient } from "@/lib/supabase/server-actions"
import { redirect } from "next/navigation"

export async function adminLogin(email: string, password: string) {
  console.log(`Admin login attempt for: ${email}`)
  
  const supabase = await createServerActionClient()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error(`Auth error for ${email}:`, authError.message, authError.code)
    return { error: authError.message }
  }

  if (!authData.user) {
    console.error(`No user data returned for ${email}`)
    return { error: "Login failed. Please try again." }
  }

  console.log(`Auth successful for user ID: ${authData.user.id}`)

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile lookup error:", profileError)
    console.error(`No profile found for user ID: ${authData.user.id}`)
    await supabase.auth.signOut()
    return { error: "Unable to verify user role. Profile not found." }
  }

  console.log(`User role: ${profile.role}`)

  if (profile.role !== 'admin') {
    console.error(`Access denied for user ${authData.user.id} with role: ${profile.role}`)
    await supabase.auth.signOut()
    return { error: "Access denied. Admin privileges required." }
  }

  console.log(`Admin login successful for ${email}`)
  // Success
  return { success: true }
}