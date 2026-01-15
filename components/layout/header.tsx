"use client"

import { Search, Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth/actions"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/admin/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
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

  const handleSignOut = async () => {
    await logout()
  }

  return (
    <header role="banner" className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary hover:bg-primary/10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 h-9 rounded-lg bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AdminThemeToggle size="default" />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10">
              <Avatar className="h-8 w-8 ring-2 ring-primary/40">
                <AvatarImage
                  src={userProfile?.avatar_url || undefined}
                  alt={userProfile?.full_name || userProfile?.email || "User"}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                  {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">
                  {userProfile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.email || 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}