"use client"

import { Search, Menu, LogOut, User, ChevronDown, Settings } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth/actions"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/admin/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"
import { AdminCommandPalette } from "@/components/admin/admin-command-palette"
import { useCommandPalette } from "@/lib/hooks/use-command-palette"

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
  const { isOpen: commandOpen, setIsOpen: setCommandOpen } = useCommandPalette()

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
    <header role="banner" className="z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary hover:bg-primary/10"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
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

      <div className="flex items-center gap-2">
        <AdminThemeToggle size="default" />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-primary/10">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage
                  src={userProfile?.avatar_url || undefined}
                  alt={userProfile?.full_name || userProfile?.email || "User"}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                  {userProfile ? getInitials(userProfile.full_name, userProfile.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-primary hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl !bg-popover !border-border shadow-lg" sideOffset={8}>
            <DropdownMenuLabel className="font-normal !text-primary">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">
                  {userProfile?.full_name || 'Admin User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.email || 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="!bg-border" />
            <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer">
              <User className="mr-2 h-4 w-4 text-primary" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-primary" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator className="!bg-border" />
            <DropdownMenuItem
              className="!text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}