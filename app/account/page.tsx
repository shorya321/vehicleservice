import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublicLayout } from "@/components/layout/public-layout"
import { AccountClient } from "./account-client"
import { getAccountData } from "./account-data"

export const metadata: Metadata = {
  title: "My Account | Manage Your Profile & Bookings",
  description: "View and manage your account settings, bookings, reviews, and notifications",
}

export const dynamic = "force-dynamic"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { profile, notificationPrefs, deletionRequest, vendorApplication, unreadNotifications } = await getAccountData(user.id)

  if (!profile) {
    redirect("/login")
  }

  // Role guard: only customers can access the account page
  if (profile.role && profile.role !== 'customer') {
    const dashboardMap: Record<string, string> = {
      admin: '/admin/dashboard',
      vendor: '/vendor/dashboard',
      business: '/business/dashboard',
    }
    redirect(dashboardMap[profile.role] || '/')
  }

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)]">
        <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
          <AccountClient
            initialTab={tab}
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
            notificationPrefs={notificationPrefs}
            deletionRequest={deletionRequest}
            vendorApplication={vendorApplication}
            unreadNotifications={unreadNotifications}
          />
        </div>
      </div>
    </PublicLayout>
  )
}
