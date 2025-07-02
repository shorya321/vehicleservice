"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function adminLogin(email: string, password: string) {
  const supabase = await createClient()

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

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile lookup error:", profileError)
    await supabase.auth.signOut()
    return { error: "Unable to verify user role. Profile not found." }
  }

  if (profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { error: "Access denied. Admin privileges required." }
  }

  // Success
  return { success: true }
}