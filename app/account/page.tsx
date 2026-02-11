import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PublicLayout } from "@/components/layout/public-layout"
import { AccountClient } from "./account-client"

export const metadata: Metadata = {
  title: "My Account | Manage Your Profile & Bookings",
  description: "View and manage your account settings, bookings, reviews, and notifications",
}

export const dynamic = "force-dynamic"

async function getAccountData(userId: string) {
  const adminClient = createAdminClient()

  // Fetch user profile with new fields
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Fetch booking stats
  const [totalResult, upcomingResult, completedResult] = await Promise.all([
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "confirmed")
      .gte("pickup_datetime", new Date().toISOString()),
    adminClient
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", userId)
      .eq("booking_status", "completed"),
  ])

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

  return {
    profile,
    stats: {
      total: totalResult.count || 0,
      upcoming: upcomingResult.count || 0,
      completed: completedResult.count || 0,
    },
    notificationPrefs,
    deletionRequest,
    vendorApplication,
  }
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account")
  }

  const { profile, stats, notificationPrefs, deletionRequest, vendorApplication } = await getAccountData(user.id)

  if (!profile) {
    redirect("/login?redirect=/account")
  }

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)]">
        <div className="luxury-container py-8 md:py-12">
          <AccountClient
            user={{
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              date_of_birth: profile.date_of_birth,
              address_street: profile.address_street,
              address_city: profile.address_city,
              address_country: profile.address_country,
              created_at: profile.created_at,
            }}
            stats={stats}
            notificationPrefs={notificationPrefs}
            deletionRequest={deletionRequest}
            vendorApplication={vendorApplication}
          />
        </div>
      </div>
    </PublicLayout>
  )
}
