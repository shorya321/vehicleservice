"use client"

import Link from "next/link"
import { NAV_ITEMS, type TabId } from "./account-nav"
import { VendorCTACompact } from "./vendor-cta-compact"

interface AccountSidebarProps {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
    created_at: string
  }
  activeTab: TabId
  /**
   * Omitted on the booking detail route, where the sidebar must navigate rather than swap a tab.
   * The tab callback rewrites the URL against the current pathname, so on /account/bookings/[ref]
   * it would produce /account/bookings/[ref]?tab=personal and render the wrong panel under the
   * wrong address. Without it every item renders as a real link back to /account.
   */
  onTabChange?: (tab: TabId) => void
  unreadNotifications: number
  /** Beside "Trips", so the rail says how much history there is before you open it. */
  tripCount?: number
  vendorApplication: {
    id: string
    status: string
    business_name: string | null
    created_at: string
  } | null
}

/**
 * The rail: navigation, and then the standing invitation to list a fleet.
 *
 * It used to open with a profile chip — avatar, name and email — directly beneath a page header
 * carrying the same name and the same email in larger type. The chip is gone. The avatar went
 * with it, to the Profile tab, which is where the rest of the fields it belongs with already
 * live; the rail is navigation now and nothing else.
 */
export function AccountSidebar({ activeTab, onTabChange, unreadNotifications, tripCount, vendorApplication }: AccountSidebarProps) {
  return (
    <aside className="account-sidebar">
      <nav className="account-sidebar-nav" aria-label="Account">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const itemBody = (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === "notifications" && unreadNotifications > 0 && (
                  <span className="account-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                )}
                {item.id === "bookings" && typeof tripCount === "number" && tripCount > 0 && (
                  <span className="account-nav-count">{tripCount}</span>
                )}
              </>
            )
            return (
              <li key={item.id}>
                {onTabChange ? (
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`account-nav-item ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {itemBody}
                  </button>
                ) : (
                  <Link
                    href={`/account?tab=${item.id}`}
                    className={`account-nav-item ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {itemBody}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <VendorCTACompact vendorApplication={vendorApplication} />
    </aside>
  )
}
