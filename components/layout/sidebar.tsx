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
  Compass,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
    {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    badge: null,
  },
    {
    name: "Vehicles",
    href: "/admin/vehicles",
    icon: Package,
    badge: null,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
    badge: "3",
  },
  {
    name: "Locations",
    href: "/admin/locations",
    icon: MapPin,
    badge: null,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    badge: null,
  },
  {
    name: "Documents",
    href: "/admin/documents",
    icon: FileText,
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
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null>(null)
  const supabase = createClient()

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