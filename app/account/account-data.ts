import { createAdminClient } from "@/lib/supabase/admin"

/**
 * The account shell's data, in one place.
 *
 * Moved out of app/account/page.tsx verbatim when the booking detail moved to its own route:
 * that page renders the same sidebar, so it needs the same profile, vendor application and
 * unread count. Re-querying them from a second file is how the two would drift.
 */
export async function getAccountData(userId: string) {
  const adminClient = createAdminClient()

  // Fetch user profile with new fields
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Fetch notification preferences
  const { data: notificationPrefs } = await adminClient
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single()

  // Fetch pending deletion request
  const { data: deletionRequest } = await adminClient
    .from("account_deletion_requests")
    .select("id, reason, requested_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .single()

  // Fetch vendor application status
  const { data: vendorApplication } = await adminClient
    .from("vendor_applications")
    .select("id, status, business_name, created_at")
    .eq("user_id", userId)
    .single()

  // Fetch unread notification count for sidebar badge
  const { count: unreadNotifications } = await adminClient
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("category", ["booking", "payment", "system"])
    .eq("is_read", false)

  return {
    profile,
    notificationPrefs,
    deletionRequest,
    vendorApplication,
    unreadNotifications: unreadNotifications || 0,
  }
}
