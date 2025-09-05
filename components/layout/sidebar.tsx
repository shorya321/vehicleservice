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
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  Building2,
  Tag,
  Route,
  Layers,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

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

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
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
    ]
  },
  {
    name: "Locations",
    href: "/admin/locations",
    icon: MapPin,
    badge: null,
  },
  {
    name: "Routes",
    href: "/admin/routes",
    icon: Route,
    badge: null,
  },
  {
    name: "Zones",
    href: "/admin/zones",
    icon: MapPin,
    badge: null,
  },
]

const bottomNavigation = [
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    badge: "5",
  },
  {
    name: "Security",
    href: "/admin/security",
    icon: Shield,
    badge: null,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    badge: null,
  },
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

  useEffect(() => {
    // Auto-expand menu items that contain the current path
    const itemsToExpand = navigation
      .filter(item => item.submenu?.some(sub => pathname.startsWith(sub.href)))
      .map(item => item.name)
    setExpandedItems(itemsToExpand)
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

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">VehicleService</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || item.submenu?.some(sub => pathname.startsWith(sub.href))
          const isExpanded = expandedItems.includes(item.name)
          
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
                    "group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 flex-shrink-0 mr-3" />
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
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-muted">
                    {item.submenu.map((subItem) => {
                      const isSubActive = pathname.startsWith(subItem.href)
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "group flex items-center rounded-md py-2 pl-6 pr-2 text-sm font-medium transition-all duration-200",
                            isSubActive
                              ? "bg-primary/10 text-primary border-l-2 border-primary -ml-[2px]"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                          )}
                        >
                          <subItem.icon className="h-4 w-4 mr-3" />
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
                "group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
              )}
            >
              <div className="flex items-center">
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    collapsed ? "mx-auto" : "mr-3"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t">
        <nav className="space-y-1 px-2 py-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      collapsed ? "mx-auto" : "mr-3"
                    )}
                  />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <Link 
          href="/admin/profile"
          className={cn(
            "flex items-center rounded-md transition-colors hover:bg-secondary/50",
            !collapsed && "space-x-3"
          )}
        >
          {!collapsed ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={userProfile?.avatar_url || undefined} 
                  alt={userProfile?.full_name || userProfile?.email || "User"}
                />
                <AvatarFallback className="bg-secondary text-xs">
                  {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userProfile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile?.email || 'admin@vehicleservice.com'}
                </p>
              </div>
            </>
          ) : (
            <Avatar className="h-8 w-8 mx-auto">
              <AvatarImage 
                src={userProfile?.avatar_url || undefined} 
                alt={userProfile?.full_name || userProfile?.email || "User"}
              />
              <AvatarFallback className="bg-secondary text-xs">
                {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </Link>
      </div>
    </div>
  )
}