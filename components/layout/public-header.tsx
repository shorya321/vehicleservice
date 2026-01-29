'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Phone, Menu, X, User, LogOut, Star } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
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
import type { CurrencyInfo } from '@/lib/currency/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface PublicHeaderProps {
  initialUser?: SupabaseUser | null
  initialProfile?: Profile | null
  currencies?: CurrencyInfo[]
  currentCurrency?: string
}

export function PublicHeader({
  initialUser = null,
  initialProfile = null,
  currencies = [],
  currentCurrency = 'AED',
}: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isNotHomePage = pathname !== '/'
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  // No loading state needed - we have initial data from server
  const [isAuthLoading] = useState(false)
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
    router.refresh()  // Refresh server components for consistency
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
    { name: "Services", href: "#services" },
    { name: "Fleet", href: "#fleet" },
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
  ]

  return (
    <motion.header
      initial={{ y: -120 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 25 }}
      className={`nav-luxury ${isScrolled ? "scrolled" : ""} ${isNotHomePage ? "has-border" : ""}`}
    >
      <div className="luxury-container">
        <div className="flex items-center justify-between">
          {/* Logo with Cormorant Garamond */}
          <Link
            href="/"
            className="footer-logo text-2xl hover:opacity-80 transition-opacity duration-300"
          >
            Infinia <span>Transfers</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-12">
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

          <div className="flex items-center gap-4 md:gap-6">
            {/* Currency Selector */}
            {currencies.length > 1 && (
              <div className="hidden sm:block">
                <CurrencySelector
                  currencies={currencies}
                  currentCurrency={currentCurrency}
                />
              </div>
            )}

            {/* Phone */}
            <a
              href="tel:+971501234567"
              className="hidden md:flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors duration-300"
              aria-label="Call us at +971 50 123 4567"
            >
              <Phone className="w-4 h-4 text-[var(--gold)]" />
              <span className="text-sm font-body">+971 50 123 4567</span>
            </a>

            {isAuthLoading ? (
              // Skeleton placeholder while checking auth
              <div className="hidden lg:flex items-center gap-4">
                <div className="h-8 w-16 bg-[var(--charcoal)] rounded animate-pulse" />
                <div className="h-8 w-20 bg-[var(--charcoal)] rounded animate-pulse" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.full_name || profile?.first_name || user?.email}
                      />
                      <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold)]">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--charcoal)] border-[var(--gold)]/20">
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
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="hover:bg-[var(--gold)]/10 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account')} className="hover:bg-[var(--gold)]/10 cursor-pointer">
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account')} className="hover:bg-[var(--gold)]/10 cursor-pointer">
                    <Star className="mr-2 h-4 w-4" />
                    My Reviews
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--gold)]/10" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden lg:inline-flex nav-link"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden lg:inline-flex btn btn-primary text-xs"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-[var(--text-primary)] p-2 rounded-lg border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 transition-all duration-300"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-navigation"
            role="navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[var(--black-void)]/98 backdrop-blur-xl border-t border-[var(--gold)]/10"
          >
            <div className="luxury-container py-6 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-[var(--text-primary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 block text-center py-3 text-sm uppercase tracking-[0.15em] rounded-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-[var(--gold)]/10 flex flex-col gap-3">
                {/* Mobile Currency Selector */}
                {currencies.length > 1 && (
                  <div className="flex justify-center py-2">
                    <CurrencySelector
                      currencies={currencies}
                      currentCurrency={currentCurrency}
                    />
                  </div>
                )}

                <a
                  href="tel:+971501234567"
                  className="flex items-center justify-center gap-2 text-[var(--text-primary)] hover:text-[var(--gold)] transition-colors duration-300 py-3"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Call us at +971 50 123 4567"
                >
                  <Phone className="w-4 h-4 text-[var(--gold)]" />
                  <span className="text-sm">Call Us</span>
                </a>
                {isAuthLoading ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-12 bg-[var(--charcoal)] rounded animate-pulse" />
                    <div className="h-12 bg-[var(--charcoal)] rounded animate-pulse" />
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-[var(--charcoal)]/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile?.avatar_url || undefined}
                          alt={profile?.full_name || profile?.first_name || user?.email}
                        />
                        <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold)] text-sm">
                          {getInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]"
                      onClick={() => {
                        router.push('/profile')
                        setIsMenuOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]"
                      onClick={() => {
                        router.push('/account')
                        setIsMenuOpen(false)
                      }}
                    >
                      My Bookings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]"
                      onClick={() => {
                        router.push('/account')
                        setIsMenuOpen(false)
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      My Reviews
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="btn btn-secondary w-full justify-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="btn btn-primary w-full justify-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}