"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userLogout } from "@/lib/auth/user-actions"
import { VendorNotificationBell } from "@/components/vendor/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"
import {
  LayoutDashboard,
  Package,
  Calendar,
  ClipboardPlus,
  DollarSign,
  User,
  Menu,
  X,
  BarChart3,
  MessageSquare,
  Star,
  FileText,
  Car,
  UserCircle,
  ChevronDown,
  ChevronRight,
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

interface VendorLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: any
  submenu?: {
    name: string
    href: string
    icon: any
  }[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    label: 'Account',
    items: [
      { name: "My Account", href: "/vendor/account", icon: UserCircle },
      { name: "Business Profile", href: "/vendor/profile", icon: User },
    ]
  },
  {
    label: 'Management',
    items: [
      {
        name: "Vehicles",
        href: "/vendor/vehicles",
        icon: Car,
        submenu: [
          {
            name: "My Vehicles",
            href: "/vendor/vehicles",
            icon: Car,
          },
        ]
      },
      { name: "Drivers", href: "/vendor/drivers", icon: Users },
      { name: "Bookings", href: "/vendor/bookings", icon: Calendar },
      { name: "Availability", href: "/vendor/availability", icon: BarChart3 },
    ]
  },
  {
    label: 'Offline Bookings',
    items: [
      { name: "Direct Bookings", href: "/vendor/direct-bookings", icon: ClipboardPlus },
    ]
  },
]

const VENDOR_NAV_LABELS = flattenNavLabels(navGroups)

const VENDOR_PROFILE_LINKS: ProfileMenuLink[] = [
  { href: "/vendor/account", label: "My account", icon: UserCircle },
  { href: "/vendor/profile", label: "Business profile", icon: User },
]

export function VendorLayout({ children }: VendorLayoutProps) {
  const { user, vendorApplication } = useVendorData()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { isOpen: commandOpen, setIsOpen: setCommandOpen } = useCommandPalette()

  const handleLogout = async () => {
    await userLogout()
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'VN'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Auto-expand menu items that contain the current path
  useEffect(() => {
    const expandActiveMenuItems = () => {
      const allItems = navGroups.flatMap(group => group.items)
      const itemsToExpand = allItems
        .filter(item => item.submenu?.some(sub => pathname.startsWith(sub.href)))
        .map(item => item.name)
      setExpandedItems(itemsToExpand)
    }
    expandActiveMenuItems()
  }, [pathname])

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || item.submenu?.some(sub => pathname.startsWith(sub.href))
    const isExpanded = expandedItems.includes(item.name)

    if (item.submenu) {
      return (
        <div key={item.name}>
          <button
            onClick={() => {
              setExpandedItems(prev =>
                prev.includes(item.name)
                  ? prev.filter(i => i !== item.name)
                  : [...prev, item.name]
              )
            }}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-[inset_0_0_30px_rgba(var(--primary-rgb),0.08)]"
                : "text-foreground/70 hover:bg-primary/5 hover:text-foreground hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "h-4 w-4 transition-all duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
              )} />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-primary/20">
              {item.submenu.map(subItem => {
                const isSubActive = pathname.startsWith(subItem.href)
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 ml-2 text-sm font-medium transition-all duration-200",
                      isSubActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[2px] shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.06)]"
                        : "text-foreground/70 hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <subItem.icon className={cn(
                      "h-4 w-4 transition-all duration-200 group-hover:scale-110",
                      isSubActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
                    )} />
                    {subItem.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-[inset_0_0_30px_rgba(var(--primary-rgb),0.08)]"
            : "text-foreground/70 hover:bg-primary/5 hover:text-foreground hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]"
        )}
      >
        <item.icon className={cn(
          "h-4 w-4 transition-all duration-200 group-hover:scale-110",
          isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
        )} />
        {item.name}
      </Link>
    )
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
            "portal-sidebar fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
              <Link href="/vendor/dashboard" className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-105">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <span className="flex flex-col leading-tight">
                  <span className="font-[family-name:var(--admin-font-display)] text-sm font-bold text-primary">VehicleService</span>
                  <span className="text-[11.5px] text-muted-foreground">Vendor Portal</span>
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto admin-scrollbar px-3 py-4">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
                  {/* Section Header */}
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-primary">
                        {group.label}
                      </span>
                    </div>
                  </div>
                  {/* Navigation Items */}
                  <div className="space-y-1">
                    {group.items.map((item) => renderNavItem(item))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Business info */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-primary/5 hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]">
                <Avatar className="h-10 w-10 ring-2 ring-primary/40">
                  <AvatarImage src={user?.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">{user?.profile?.full_name ? getInitials(user.profile.full_name) : 'VN'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate text-foreground">{user?.profile?.full_name || 'Vendor'}</p>
                  <p className="text-xs text-foreground/60 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
          {/* Top bar */}
          <header className="portal-header z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-primary hover:bg-primary/10"
                onClick={() => setSidebarOpen(true)}
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
