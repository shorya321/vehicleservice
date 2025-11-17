'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Phone, Menu, X, User, LogOut, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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

type Profile = Database['public']['Tables']['profiles']['Row']

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

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

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
  }

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchProfile(user.id)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled ? "bg-luxury-black/80 backdrop-blur-md shadow-xl border-b border-luxury-gold/10" : "bg-transparent"}`}
    >
      <div className="luxury-container">
        <div className="flex items-center justify-between h-20 md:h-24">
          <Link
            href="/"
            className="text-3xl md:text-4xl font-serif text-luxury-pearl hover:text-luxury-gold
                       transition-all duration-300 hover:scale-105 tracking-tight"
          >
            Infinia <span className="luxury-text-gradient font-bold">Transfers</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-luxury-lightGray hover:text-luxury-gold transition-colors duration-300
                           font-sans text-sm uppercase tracking-wider relative group px-2 py-1 rounded-sm
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold
                           focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-black"
              >
                {item.name}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-luxury-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Phone */}
            <a
              href="tel:+971501234567"
              className="hidden md:flex items-center space-x-2 text-luxury-lightGray hover:text-luxury-gold
                         transition-colors duration-300 px-2 py-1 rounded-md
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
              aria-label="Call us at +971 50 123 4567"
            >
              <Phone className="w-4 h-4 text-luxury-gold" />
              <span className="font-sans text-sm">+971 50 123 4567</span>
            </a>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profile?.avatar_url || undefined} 
                        alt={profile?.full_name || profile?.first_name || user?.email}
                      />
                      <AvatarFallback className="bg-secondary">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/customer/bookings')}>
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/customer/reviews')}>
                    <Star className="mr-2 h-4 w-4" />
                    My Reviews
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="default" asChild className="hidden lg:inline-flex">
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="default" asChild className="hidden lg:inline-flex">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-luxury-pearl p-2 rounded-md
                         transition-all duration-300 hover:bg-luxury-gold/10 active:scale-95
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="lg:hidden bg-luxury-black/95 backdrop-blur-lg border-t border-luxury-gold/10"
          >
            <div className="luxury-container py-5 flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-luxury-pearl hover:bg-luxury-gold/10 block text-center hover:text-luxury-gold
                             transition-all duration-300 font-sans py-3 text-sm uppercase tracking-wider rounded-md
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold
                             focus-visible:ring-inset active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-luxury-gold/10 flex flex-col space-y-3">
                <a
                  href="tel:+971501234567"
                  className="flex items-center justify-center space-x-2 text-luxury-pearl hover:text-luxury-gold
                             transition-colors duration-300 py-2 rounded-md
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold
                             focus-visible:ring-inset"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Call us at +971 50 123 4567"
                >
                  <Phone className="w-5 h-5 text-luxury-gold" />
                  <span>Call Us</span>
                </a>
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile?.avatar_url || undefined}
                          alt={profile?.full_name || profile?.first_name || user?.email}
                        />
                        <AvatarFallback className="bg-secondary text-sm">
                          {getInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-luxury-pearl">
                          {profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
                        </p>
                        <p className="text-xs text-luxury-lightGray">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
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
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/customer/bookings')
                        setIsMenuOpen(false)
                      }}
                    >
                      My Bookings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/customer/reviews')
                        setIsMenuOpen(false)
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      My Reviews
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
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
                  <>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}