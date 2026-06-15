'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LogOut, Star, Building2, Car, LayoutDashboard } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { userLogout } from '@/lib/auth/user-actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCurrency } from '@/lib/currency/context'
import { HamburgerButton } from '@/components/layout/mobile-menu/hamburger-button'
import { MobileMenu } from '@/components/layout/mobile-menu'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'
import Image from 'next/image'

type Profile = Database['public']['Tables']['profiles']['Row']

interface PublicHeaderProps {
  initialUser?: SupabaseUser | null
  initialProfile?: Profile | null
  siteSettings?: SiteSettingsConfig
}

export function PublicHeader({
  initialUser = null,
  initialProfile = null,
  siteSettings,
}: PublicHeaderProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  const { allCurrencies } = useCurrency()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsScrolled(window.scrollY > 50)
      }, 10)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Only listen for auth CHANGES (sign out, sign in on another tab, etc.)
    // Initial state comes from server props, no need to fetch it
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (profileData && isMounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    // Clear client state immediately for instant UI update
    setUser(null)
    setProfile(null)

    await userLogout()
    router.push("/login")
  }

  const getInitials = (profile: Profile | null) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  // Adjusted nav items for luxury theme
  const navItems = [
    { name: "Services", href: "/#services" },
    { name: "Fleet", href: "/#fleet" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/#faq" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <header
      className={`nav-luxury animate-header-slide-in ${isScrolled ? "scrolled" : ""}`}
    >
      <div className="luxury-container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            aria-label={`${settings.brand_name}, go to homepage`}
            className="footer-logo text-2xl hover:opacity-80 transition-opacity duration-200"
          >
            {settings.header_logo_url ? (
              <Image
                src={settings.header_logo_url}
                alt={settings.brand_name}
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            ) : (
              <>{settings.brand_name.includes(' ') ? (
                <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
              ) : settings.brand_name}</>
            )}
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-12">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Currency Selector */}
            {allCurrencies.length > 1 && (
              <CurrencySelector className="scale-90 sm:scale-100 origin-right" />
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-10 w-10 rounded-full border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.full_name || profile?.first_name || user?.email}
                      />
                      <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold-text)]">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--black-warm)] border border-[var(--graphite)]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-[var(--text-primary)]">
                        {profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
                      </p>
                      <p className="text-xs leading-none text-[var(--text-muted)]">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--gold)]/10" />
                  {(!profile?.role || profile.role === 'customer') ? (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/account?tab=personal')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/account?tab=bookings')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                        <Car className="mr-2 h-4 w-4" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/account?tab=reviews')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                        <Star className="mr-2 h-4 w-4" />
                        My Reviews
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/become-vendor')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                        <Building2 className="mr-2 h-4 w-4" />
                        Partner With Us
                      </DropdownMenuItem>
                    </>
                  ) : profile.role === 'admin' ? (
                    <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </DropdownMenuItem>
                  ) : profile.role === 'vendor' ? (
                    <DropdownMenuItem onClick={() => router.push('/vendor/dashboard')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </DropdownMenuItem>
                  ) : profile.role === 'business' ? (
                    <DropdownMenuItem onClick={() => router.push('/business/dashboard')} className="text-[var(--text-primary)] focus:text-[var(--text-primary)] hover:bg-[var(--gold)]/10 cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator className="bg-[var(--gold)]/10" />
                  <DropdownMenuItem
                    className="text-red-700 dark:text-red-400 focus:text-red-700 dark:focus:text-red-400 hover:bg-red-700/10 dark:hover:bg-red-500/10 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
            {/* Book Transfer CTA — desktop only */}
            <Link
              href="/#services"
              className="btn-cta-header hidden lg:block"
            >
              Book Transfer
            </Link>
            <HamburgerButton
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        user={user}
        profile={profile}
        getInitials={getInitials}
        onSignOut={handleSignOut}
        siteSettings={settings}
      />
    </header>
  )
}