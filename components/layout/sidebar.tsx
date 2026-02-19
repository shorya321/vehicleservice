"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  Package,
  MapPin,
  CreditCard,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  Building2,
  Tag,
  Route,
  Layers,
  Mail,
  Star,
  BookOpen,
  FolderOpen,
  PenLine,
  MessageSquare,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useAdminNotifications } from "@/lib/hooks/use-admin-notifications"

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string | null
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
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
    ]
  },
  {
    label: 'Management',
    items: [
      {
        name: "Bookings",
        href: "/admin/bookings",
        icon: Calendar,
        badge: null,
      },
      {
        name: "Users",
        href: "/admin/users",
        icon: Users,
        badge: null,
      },
      {
        name: "Vendor Applications",
        href: "/admin/vendor-applications",
        icon: Building2,
        badge: null,
      },
      {
        name: "Business Accounts",
        href: "/admin/businesses",
        icon: Building2,
        badge: null,
      },
      {
        name: "Vehicles",
        href: "/admin/vehicles",
        icon: Car,
        badge: null,
        submenu: [
          {
            name: "All Vehicles",
            href: "/admin/vehicles",
            icon: Car,
          },
          {
            name: "Categories",
            href: "/admin/vehicle-categories",
            icon: Tag,
          },
          {
            name: "Vehicle Types",
            href: "/admin/vehicle-types",
            icon: Layers,
          },
          {
            name: "Addons",
            href: "/admin/addons",
            icon: Package,
          },
        ]
      },
      {
        name: "Reviews",
        href: "/admin/reviews",
        icon: Star,
        badge: null,
      },
    ]
  },
  {
    label: 'Content',
    items: [
      {
        name: "Blog",
        href: "/admin/blog/posts",
        icon: BookOpen,
        badge: null,
        submenu: [
          {
            name: "Blog Posts",
            href: "/admin/blog/posts",
            icon: PenLine,
          },
          {
            name: "Categories",
            href: "/admin/blog/categories",
            icon: FolderOpen,
          },
          {
            name: "Tags",
            href: "/admin/blog/tags",
            icon: Tag,
          },
        ]
      },
      {
        name: "Contact",
        href: "/admin/contact",
        icon: MessageSquare,
        badge: null,
      },
    ]
  },
  {
    label: 'Service Areas',
    items: [
      {
        name: "Locations",
        href: "/admin/locations",
        icon: MapPin,
        badge: null,
        submenu: [
          {
            name: "All Locations",
            href: "/admin/locations",
            icon: MapPin,
          },
          {
            name: "Routes",
            href: "/admin/routes",
            icon: Route,
          },
          {
            name: "Zones",
            href: "/admin/zones",
            icon: MapPin,
          },
        ]
      },
    ]
  },
  {
    label: 'Settings',
    items: [
      {
        name: "Emails",
        href: "/admin/emails",
        icon: Mail,
        badge: null,
      },
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        badge: null,
        submenu: [
          {
            name: "General",
            href: "/admin/settings",
            icon: Settings,
          },
          {
            name: "Notifications",
            href: "/admin/notifications",
            icon: Bell,
          },
        ]
      },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null>(null)
  const supabase = createClient()
  const { unreadCount } = useAdminNotifications(5)

  useEffect(() => {
    const expandActiveMenuItems = () => {
      // Auto-expand menu items that contain the current path
      const allItems = navGroups.flatMap(group => group.items)
      const itemsToExpand = allItems
        .filter(item => item.submenu?.some(sub => pathname.startsWith(sub.href)))
        .map(item => item.name)
      setExpandedItems(itemsToExpand)
    }
    expandActiveMenuItems()
  }, [pathname])

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      }
    }
    fetchUserProfile()
  }, [supabase])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || item.submenu?.some(sub => pathname.startsWith(sub.href))
    const isExpanded = expandedItems.includes(item.name)
    const showNotificationBadge = item.name === "Notifications" && unreadCount > 0
    const badgeText = unreadCount > 9 ? "9+" : unreadCount.toString()

    if (item.submenu && !collapsed) {
      return (
        <div key={item.name}>
          <button
            onClick={() => {
              setExpandedItems(prev =>
                prev.includes(item.name)
                  ? prev.filter(name => name !== item.name)
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
            <div className="flex items-center">
              <item.icon className={cn(
                "h-4 w-4 flex-shrink-0 mr-3 transition-all duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
              )} />
              <span>{item.name}</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded ? "rotate-180" : ""
              )}
            />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary/20">
              {item.submenu.map((subItem) => {
                const isSubActive = pathname.startsWith(subItem.href)
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={cn(
                      "group flex items-center rounded-xl py-2 pl-6 pr-2 text-sm font-medium transition-all duration-200",
                      isSubActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[2px] shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.06)]"
                        : "text-foreground/70 hover:bg-primary/5 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <subItem.icon className={cn(
                      "h-4 w-4 mr-3 transition-all duration-200 group-hover:scale-110",
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
          "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary shadow-[inset_0_0_30px_rgba(var(--primary-rgb),0.08)]"
            : "text-foreground/70 hover:bg-primary/5 hover:text-foreground hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)]"
        )}
      >
        <div className="flex items-center">
          <item.icon
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-all duration-200 group-hover:scale-110",
              collapsed ? "mx-auto" : "mr-3",
              isActive ? "text-primary" : "text-foreground/60 group-hover:text-primary"
            )}
          />
          {!collapsed && <span>{item.name}</span>}
        </div>
        {!collapsed && (item.badge || showNotificationBadge) && (
          <span className={cn(
            "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold uppercase tracking-wider",
            showNotificationBadge
              ? "bg-destructive/20 border border-destructive/40 text-destructive"
              : "bg-primary/20 border border-primary/40 text-primary"
          )}>
            {showNotificationBadge ? badgeText : item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-card border-border shadow-lg transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center space-x-2 group">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 transition-transform group-hover:scale-105">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-serif text-foreground">VehicleService</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 text-primary hover:bg-primary/10", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto admin-scrollbar px-2 py-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
            {/* Section Header */}
            {!collapsed && (
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-px bg-gradient-to-r from-primary/60 to-transparent" />
                  <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-primary">
                    {group.label}
                  </span>
                </div>
              </div>
            )}
            {/* Navigation Items */}
            <div className="space-y-1">
              {group.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          href="/admin/profile"
          className={cn(
            "flex items-center rounded-xl transition-all duration-200 hover:bg-primary/5 hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)] p-2",
            !collapsed && "space-x-3"
          )}
        >
          {!collapsed ? (
            <>
              <Avatar className="h-9 w-9 ring-2 ring-primary/40">
                <AvatarImage
                  src={userProfile?.avatar_url || undefined}
                  alt={userProfile?.full_name || userProfile?.email || "User"}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                  {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {userProfile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs truncate text-foreground/60">
                  {userProfile?.email || 'admin@vehicleservice.com'}
                </p>
              </div>
            </>
          ) : (
            <Avatar className="h-9 w-9 mx-auto ring-2 ring-primary/40">
              <AvatarImage
                src={userProfile?.avatar_url || undefined}
                alt={userProfile?.full_name || userProfile?.email || "User"}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </Link>
      </div>
    </div>
  )
}
