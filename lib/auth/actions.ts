"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error("Logout error:", error)
    throw new Error("Failed to logout")
  }
  
  redirect("/admin/login")
}

export async function getCurrentUser() {
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

export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.profile?.role === 'admin'
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/admin/login")
  }
  
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user || user.profile?.role !== 'admin') {
    redirect("/admin/login")
  }
  
  return user
}