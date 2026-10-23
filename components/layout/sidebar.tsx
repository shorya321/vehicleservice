"use client"

import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  Settings,
  FileText,
  MapPin,
  Building2,
  ClipboardCheck,
  Tag,
  Mail,
  Star,
  BookOpen,
  Search,
  MessageSquare,
} from "lucide-react"
import { useAdminNotifications } from "@/lib/hooks/use-admin-notifications"
import { usePendingVendorApplications } from "@/lib/hooks/use-pending-vendor-applications"
import { useSidebarRail } from "@/lib/hooks/use-sidebar-rail"
import type { PortalNavGroup } from "@/lib/portal-sidebar/nav"
import { PortalSidebar, type PortalSidebarBrand } from "./portal-sidebar/portal-sidebar"

export const navGroups: PortalNavGroup[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { name: "Bookings", href: "/admin/bookings", icon: Calendar },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Vendor Applications", href: "/admin/vendor-applications", icon: ClipboardCheck },
      { name: "Business Accounts", href: "/admin/businesses", icon: Building2 },
      {
        name: "Vehicles",
        href: "/admin/vehicles",
        icon: Car,
        submenu: [
          { name: "All Vehicles", href: "/admin/vehicles" },
          { name: "Categories", href: "/admin/vehicle-categories" },
          { name: "Vehicle Types", href: "/admin/vehicle-types" },
          { name: "Addons", href: "/admin/addons" },
        ],
      },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Content",
    items: [
      {
        name: "Pages",
        href: "/admin/content/pages",
        icon: FileText,
        submenu: [
          { name: "All Pages", href: "/admin/content/pages" },
          { name: "Shared Sections", href: "/admin/content/shared" },
        ],
      },
      { name: "SEO", href: "/admin/seo", icon: Search },
      {
        name: "Blog",
        href: "/admin/blog/posts",
        icon: BookOpen,
        submenu: [
          { name: "Blog Posts", href: "/admin/blog/posts" },
          { name: "Categories", href: "/admin/blog/categories" },
          { name: "Tags", href: "/admin/blog/tags" },
        ],
      },
      { name: "Contact", href: "/admin/contact", icon: MessageSquare },
    ],
  },
  {
    label: "Service Areas",
    items: [
      {
        name: "Locations",
        href: "/admin/locations",
        icon: MapPin,
        submenu: [
          { name: "All Locations", href: "/admin/locations" },
          { name: "Location Types", href: "/admin/location-types" },
          { name: "Routes", href: "/admin/routes" },
          { name: "Zones", href: "/admin/zones" },
        ],
      },
      { name: "Service Codes", href: "/admin/service-codes", icon: Tag },
    ],
  },
  {
    label: "Settings",
    items: [
      { name: "Emails", href: "/admin/emails", icon: Mail },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        submenu: [
          { name: "General", href: "/admin/settings" },
          { name: "Notifications", href: "/admin/notifications" },
        ],
      },
    ],
  },
]

const ADMIN_BRAND: PortalSidebarBrand = {
  href: "/admin/dashboard",
  subtitle: "Admin Panel",
  icon: Car,
}

export function Sidebar() {
  const { rail, canRail, toggleRail } = useSidebarRail("admin-sidebar-rail", 768)
  const { unreadCount } = useAdminNotifications(5)
  const pendingApplications = usePendingVendorApplications()

  return (
    <PortalSidebar
      groups={navGroups}
      brand={ADMIN_BRAND}
      rail={rail}
      canRail={canRail}
      onToggleRail={toggleRail}
      counts={{
        "/admin/notifications": unreadCount,
        "/admin/vendor-applications": pendingApplications,
      }}
    />
  )
}
