"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { userLogout } from "@/lib/auth/user-actions"
import { VendorNotificationBell } from "@/components/vendor/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"
import {
  LayoutDashboard,
  Package,
  Calendar,
  ClipboardPlus,
  User,
  Menu,
  BarChart3,
  Car,
  UserCircle,
  Users,
  Search,
} from "lucide-react"
import { useVendorData } from "@/lib/vendor/vendor-data-context"
import { VendorCommandPalette } from "@/components/vendor/vendor-command-palette"
import { useCommandPalette } from "@/lib/hooks/use-command-palette"
import { vendorProfileStatus } from "@/lib/portal-header/controls"
import { StatusChip } from "@/components/admin/header/status-chip"
import { ProfileMenu, type ProfileMenuLink } from "@/components/admin/header/profile-menu"
import { NavigationProgressProvider } from "./navigation-progress/navigation-progress-provider"
import { TopProgressBar } from "./navigation-progress/top-progress-bar"
import { ContentLoader } from "./navigation-progress/content-loader"
import { flattenNavLabels } from "./navigation-progress/classify-navigation"
import { useSidebarRail } from "@/lib/hooks/use-sidebar-rail"
import { useScrollbarReveal } from "@/lib/hooks/use-scrollbar-reveal"
import type { PortalNavGroup } from "@/lib/portal-sidebar/nav"
import { PortalSidebar, type PortalSidebarBrand } from "./portal-sidebar/portal-sidebar"

interface VendorLayoutProps {
  children: React.ReactNode
}

const navGroups: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Account",
    items: [
      { name: "My Account", href: "/vendor/account", icon: UserCircle },
      { name: "Business Profile", href: "/vendor/profile", icon: User },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Vehicles", href: "/vendor/vehicles", icon: Car },
      { name: "Drivers", href: "/vendor/drivers", icon: Users },
      { name: "Bookings", href: "/vendor/bookings", icon: Calendar },
      { name: "Availability", href: "/vendor/availability", icon: BarChart3 },
    ],
  },
  {
    label: "Offline Bookings",
    items: [{ name: "Direct Bookings", href: "/vendor/direct-bookings", icon: ClipboardPlus }],
  },
]

const VENDOR_BRAND: PortalSidebarBrand = {
  href: "/vendor/dashboard",
  subtitle: "Vendor Portal",
  icon: Package,
}

const VENDOR_NAV_LABELS = flattenNavLabels(navGroups)

const VENDOR_PROFILE_LINKS: ProfileMenuLink[] = [
  { href: "/vendor/account", label: "My account", icon: UserCircle },
  { href: "/vendor/profile", label: "Business profile", icon: User },
]

export function VendorLayout({ children }: VendorLayoutProps) {
  const { user, vendorApplication } = useVendorData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isOpen: commandOpen, setIsOpen: setCommandOpen } = useCommandPalette()
  const { rail, canRail, toggleRail } = useSidebarRail("vendor-sidebar-rail", 1024)
  useScrollbarReveal()

  const handleLogout = async () => {
    await userLogout()
  }

  return (
    <NavigationProgressProvider navLabels={VENDOR_NAV_LABELS}>
      <TopProgressBar />
      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          // Close the mobile drawer as soon as a link is tapped, so the page
          // loader underneath is visible while the next page loads.
          onClick={(e) => {
            if (sidebarOpen && e.target instanceof Element && e.target.closest("a[href]")) setSidebarOpen(false)
          }}
          className={cn(
            "fixed inset-y-0 left-0 z-[60] lg:z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <PortalSidebar
            groups={navGroups}
            brand={VENDOR_BRAND}
            rail={rail}
            canRail={canRail}
            onToggleRail={toggleRail}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Main content */}
        <div className={cn("flex flex-1 flex-col overflow-hidden", rail ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
          {/* Top bar */}
          <header className="portal-header z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-primary hover:bg-primary/10"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search Trigger */}
              <Button
                variant="ghost"
                onClick={() => setCommandOpen(true)}
                className="hidden sm:flex items-center gap-2 sm:w-64 lg:w-80 rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/30 h-9 justify-start"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">Search...</span>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-xs">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </Button>
            </div>

            <div className="flex items-center gap-2.5">
              <StatusChip status={vendorProfileStatus(vendorApplication?.status)} />
              <AdminThemeToggle size="default" />
              <VendorNotificationBell />
              <ProfileMenu
                name={user?.profile?.full_name}
                email={user?.email}
                avatarUrl={user?.profile?.avatar_url}
                roleLabel="Vendor"
                fallbackName="Vendor"
                links={VENDOR_PROFILE_LINKS}
                onSignOut={handleLogout}
              />
            </div>

            <VendorCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
          </header>

          {/* Page content */}
          <div className="relative isolate flex min-h-0 flex-1 flex-col">
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="w-full px-4 py-6 md:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <ContentLoader />
          </div>
        </div>
      </div>
    </NavigationProgressProvider>
  )
}
