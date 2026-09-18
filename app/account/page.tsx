import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublicLayout } from "@/components/layout/public-layout"
import { AccountClient } from "./account-client"
import { getAccountData } from "./account-data"
import { getAccountOverview } from "./overview-actions"
import { getRecentNotifications } from "./notification-actions"
import type { NotificationListItem } from "@/components/account/types"

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

  // The overview is the landing panel, so its content is read here rather than from an effect on
  // mount: the next transfer is the one thing on this page worth server-rendering, and fetching
  // it client-side meant every visit opened on a skeleton. Both run for any tab, because the rail
  // switches panels in place and the data has to be present when it does.
  const [overview, recentAlerts] = await Promise.all([
    getAccountOverview(user.id),
    getRecentNotifications(3),
  ])

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
            overview={overview}
            recentAlerts={(recentAlerts.data as NotificationListItem[] | null) ?? []}
          />
        </div>
      </div>
    </PublicLayout>
  )
}
