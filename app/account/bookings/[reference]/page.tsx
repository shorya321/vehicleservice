import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PublicLayout } from "@/components/layout/public-layout"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { getAccountData } from "../../account-data"
import { getBookingByReference } from "../../booking-actions"
import { BookingDetailContent, type DetailBooking } from "./booking-detail-content"

export const metadata: Metadata = {
  title: "Booking details",
  description: "The full record of one transfer.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { profile, vendorApplication, unreadNotifications } = await getAccountData(user.id)

  /**
   * The row's status is nullable in the schema and the sidebar's prop is not. A null status has no
   * entry in the sidebar's status map, so that branch already rendered nothing; narrowing to null
   * here says the same thing in the type rather than leaning on the lookup to miss.
   */
  const vendorApp =
    vendorApplication && vendorApplication.status
      ? {
          id: vendorApplication.id,
          status: vendorApplication.status,
          business_name: vendorApplication.business_name,
          created_at: vendorApplication.created_at,
        }
      : null

  if (!profile) {
    redirect("/login")
  }

  // Same role guard the account index applies. A vendor reaching this URL belongs on their own
  // dashboard, not on a customer's booking.
  if (profile.role && profile.role !== "customer") {
    const dashboardMap: Record<string, string> = {
      admin: "/admin/dashboard",
      vendor: "/vendor/dashboard",
      business: "/business/dashboard",
    }
    redirect(dashboardMap[profile.role] || "/")
  }

  const { data: booking, error } = await getBookingByReference(reference)

  // Not-found and not-yours are both 404. A 403 would confirm the reference exists, which turns
  // this page into a way to probe for other customers' bookings.
  if (error || !booking) {
    notFound()
  }

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)]">
        <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
          <div className="account-layout">
            {/* No onTabChange: every item navigates back to /account rather than swapping a
                panel underneath this URL. */}
            <div className="hidden lg:block">
              <AccountSidebar
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
                activeTab="bookings"
                unreadNotifications={unreadNotifications}
                vendorApplication={vendorApp}
              />
            </div>

            <main className="account-content">
              <BookingDetailContent booking={booking as unknown as DetailBooking} />
            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
