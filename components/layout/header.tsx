"use client"

import { Search, Menu, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth/actions"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/admin/notifications/notification-bell"
import { AdminThemeToggle } from "@/components/admin/ui/theme-toggle"
import { AdminCommandPalette } from "@/components/admin/admin-command-palette"
import { useCommandPalette } from "@/lib/hooks/use-command-palette"
import { readSiteFlags } from "@/lib/site-settings/flags"
import { adminSiteStatus } from "@/lib/portal-header/controls"
import { StatusChip } from "@/components/admin/header/status-chip"
import { ProfileMenu, type ProfileMenuLink } from "@/components/admin/header/profile-menu"

const ADMIN_PROFILE_LINKS: ProfileMenuLink[] = [
  { href: "/admin/profile", label: "Profile settings", icon: User },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [userProfile, setUserProfile] = useState<{
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null>(null)
  // null until the flag loads, so the chip never flashes the wrong state
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
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
    readSiteFlags(supabase).then((flags) => setMaintenanceMode(flags.maintenanceMode))
  }, [supabase])

  const handleSignOut = async () => {
    await logout()
  }

  return (
    <header role="banner" className="portal-header z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-primary hover:bg-primary/10"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
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

      <div className="flex items-center gap-2.5">
        <StatusChip status={maintenanceMode === null ? null : adminSiteStatus(maintenanceMode)} />
        <AdminThemeToggle size="default" />
        <NotificationBell />
        <ProfileMenu
          name={userProfile?.full_name}
          email={userProfile?.email}
          avatarUrl={userProfile?.avatar_url}
          roleLabel="Administrator"
          fallbackName="Admin User"
          links={ADMIN_PROFILE_LINKS}
          onSignOut={handleSignOut}
        />
      </div>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}