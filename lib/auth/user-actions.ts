"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function userLogout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Logout error:", error)
    throw new Error("Failed to logout")
  }

  // Navigation handled by client for proper state refresh
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return {
    ...user,
    profile
  }
}

export async function isCustomer() {
  const user = await getCurrentUserProfile()
  return user?.profile?.role === 'customer'
}

export async function isVendor() {
  const user = await getCurrentUserProfile()
  return user?.profile?.role === 'vendor'
}

export async function requireCustomer() {
  const user = await getCurrentUserProfile()
  
  if (!user || user.profile?.role !== 'customer') {
    redirect("/login")
  }
  
  return user
}

export async function requireVendor() {
  const user = await getCurrentUserProfile()
  
  if (!user || user.profile?.role !== 'vendor') {
    redirect("/login")
  }
  
  return user
}

export async function getUserRole() {
  const user = await getCurrentUserProfile()
  return user?.profile?.role || null
}