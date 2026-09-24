'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { userLogout } from '@/lib/auth/user-actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { HEADER_PROFILE_COLUMNS, type HeaderProfile } from '@/components/layout/header-profile'
import { AccountMenu } from '@/components/layout/account-menu'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCurrency } from '@/lib/currency/context'
import { HamburgerButton } from '@/components/layout/mobile-menu/hamburger-button'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// The drawer (motion + Radix Sheet) is client-only behind the mounted gate
// already, so it loads after hydration instead of in every page's header bundle.
const MobileMenu = dynamic(
  () => import('@/components/layout/mobile-menu').then((m) => m.MobileMenu),
  { ssr: false }
)

type Profile = HeaderProfile

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
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const supabase = useMemo(() => createClient(), [])
  const [mounted, setMounted] = useState(false)
  const userId = user?.id ?? null
  /** Which user's profile is already loaded, so the fetch below runs once. */
  const loadedProfileId = useRef<string | null>(initialProfile?.id ?? null)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    setIsScrolled(window.scrollY > 50)

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
    // Only listen for auth CHANGES (sign out, sign in on another tab, etc.)
    // Initial state comes from server props, no need to fetch it.
    //
    // This callback must stay synchronous. auth-js awaits every subscriber
    // while holding the GoTrue Web Lock, and every other browser-side Supabase
    // call waits on that lock with no timeout at all, so awaiting a query in
    // here stalls the whole origin for the length of that round trip, in every
    // tab. The profile fetch therefore lives in its own effect below, which
    // runs after the lock has been released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (!currentUser) {
        loadedProfileId.current = null
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    // Skipped when the server already sent this user's profile, which is the
    // common case, so this normally costs nothing.
    if (!userId || loadedProfileId.current === userId) {
      return
    }

    let isMounted = true
    loadedProfileId.current = userId

    supabase
      .from('profiles')
      .select(HEADER_PROFILE_COLUMNS)
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data && isMounted) {
          setProfile(data)
        }
      })

    return () => {
      isMounted = false
    }
  }, [supabase, userId])

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

  /**
   * Hash links point at sections of the homepage, so they can never identify a
   * page on their own. Only the real routes get the active treatment, which
   * keeps Services from reading as current on every homepage visit.
   */
  const isCurrentPage = (href: string) => {
    if (href.includes('#')) return false
    return pathname === href || pathname.startsWith(`${href}/`)
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
        {/* Three-column grid on desktop so the nav is centred against the
            container rather than against whatever space the wordmark leaves.
            brand_name is white-label configurable, so justify-between alone
            moved the nav for every tenant. */}
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Logo */}
          <Link
            href="/"
            aria-label={`${settings.brand_name}, go to homepage`}
            className="footer-logo header-logo hover:opacity-80 transition-opacity duration-200"
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
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link"
                aria-current={isCurrentPage(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-5 lg:justify-self-end">
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Currency Selector. Mounted guard prevents Radix useId hydration mismatch.
                No transform scaling: it resampled the label on fractional device
                pixel ratios and moved the Radix popper anchor off the trigger. */}
            {mounted && allCurrencies.length > 1 && <CurrencySelector />}

            {mounted && user ? (
              <AccountMenu
                user={user}
                profile={profile}
                initials={getInitials(profile)}
                onSignOut={handleSignOut}
              />
            ) : mounted ? (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            ) : null}
            {/* Book CTA. Desktop only */}
            <Link
              href="/#services"
              className="btn-book-header hidden lg:inline-flex"
            >
              Book <span aria-hidden="true" className="btn-book-header-arrow">&rarr;</span>
            </Link>
            <HamburgerButton
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </div>
        </div>
      </div>

      {mounted && (
        <MobileMenu
          isOpen={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          user={user}
          profile={profile}
          getInitials={getInitials}
          onSignOut={handleSignOut}
          siteSettings={settings}
        />
      )}
    </header>
  )
}