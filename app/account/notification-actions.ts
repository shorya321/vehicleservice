"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type NotificationCategory = "all" | "booking" | "payment" | "system"

export interface NotificationFilters {
  category?: NotificationCategory
  page?: number
  limit?: number
}

export async function getNotifications(filters: NotificationFilters = {}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated", total: 0, unreadCount: 0 }
  }

  const limit = filters.limit || 20
  const page = filters.page || 1
  const offset = (page - 1) * limit

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .in("category", ["booking", "payment", "system"])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }

  const { data: notifications, error, count } = await query

  if (error) {
    return { data: null, error: error.message, total: 0, unreadCount: 0 }
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("category", ["booking", "payment", "system"])
    .eq("is_read", false)

  return {
    data: notifications || [],
    error: null,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    unreadCount: unreadCount || 0,
    page,
  }
}

export async function getNotificationStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const [total, unread, read, booking, payment, system] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("category", ["booking", "payment", "system"])
      .then((r) => r.count || 0),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("category", ["booking", "payment", "system"])
      .eq("is_read", false)
      .then((r) => r.count || 0),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("category", ["booking", "payment", "system"])
      .eq("is_read", true)
      .then((r) => r.count || 0),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category", "booking")
      .then((r) => r.count || 0),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category", "payment")
      .then((r) => r.count || 0),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("category", "system")
      .then((r) => r.count || 0),
  ])

  return { data: { total, unread, read, booking, payment, system }, error: null }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/account")
  return { error: null }
}

export async function markAllNotificationsAsRead(category?: NotificationCategory) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .in("category", ["booking", "payment", "system"])
    .eq("is_read", false)

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { error } = await query

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/account")
  return { error: null }
}

export async function getRecentNotifications(limit: number = 5) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .in("category", ["booking", "payment", "system"])
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
