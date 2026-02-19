"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userLogout } from "@/lib/auth/user-actions"
import { VendorNotificationBell } from "@/components/vendor/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"
import {
  LayoutDashboard,
  Package,
  Calendar,
  DollarSign,
  User,
  LogOut,
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
import { Input } from "@/components/ui/input"
import { useVendorData } from "@/lib/vendor/vendor-data-context"

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
]

export function VendorLayout({ children }: VendorLayoutProps) {
  const { user, vendorApplication } = useVendorData()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

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
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/vendor/dashboard" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center transition-transform group-hover:scale-105">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold font-serif">Vendor Portal</span>
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
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
                {/* Section Header */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-px bg-gradient-to-r from-primary/60 to-transparent" />
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
                <AvatarImage src="/avatar-placeholder.png" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">VN</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
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
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary hover:bg-primary/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="hidden sm:flex relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 pr-14 h-9 w-full rounded-lg bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground pointer-events-none">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <AdminThemeToggle size="default" />

            {/* Notification Bell */}
            <VendorNotificationBell />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-primary/10">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src="/avatar-placeholder.png" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                      {user?.profile?.full_name ? getInitials(user.profile.full_name) : 'VN'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-primary hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl !bg-popover !border-border shadow-lg" align="end" sideOffset={8} forceMount>
                <DropdownMenuLabel className="font-normal !text-primary">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{user?.profile?.full_name || 'Vendor'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="!bg-border" />
                <DropdownMenuItem asChild className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer">
                  <Link href="/vendor/account">
                    <UserCircle className="mr-2 h-4 w-4 text-primary" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer">
                  <Link href="/vendor/profile">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    Business Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="!bg-border" />
                <DropdownMenuItem onClick={handleLogout} className="!text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="w-full px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
