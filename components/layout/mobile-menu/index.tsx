'use client'

import { motion, type Variants } from 'motion/react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { useCurrency } from '@/lib/currency/context'
import { useReducedMotion } from '@/lib/business/animation/hooks'
import { MenuUserCard } from './menu-user-card'
import { MenuSection } from './menu-section'
import { MenuNavItem, MenuButtonItem } from './menu-nav-item'
import { MenuFooter } from './menu-footer'
import {
  X,
  Compass,
  Car,
  BookOpen,
  HelpCircle,
  Mail,
  User,
  Star,
  Building2,
  LayoutDashboard,
  LogOut,
  Phone,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MobileMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: SupabaseUser | null
  profile: Profile | null
  getInitials: (profile: Profile | null) => string
  onSignOut: () => void
}

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1],
      delay: 0.15,
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

export function MobileMenu({
  isOpen,
  onOpenChange,
  user,
  profile,
  getInitials,
  onSignOut,
}: MobileMenuProps) {
  const router = useRouter()
  const { allCurrencies } = useCurrency()
  const reducedMotion = useReducedMotion()

  const close = () => onOpenChange(false)

  const navigate = (path: string) => {
    router.push(path)
    close()
  }

  const getDashboardPath = () => {
    if (!profile?.role) return '/'
    if (profile.role === 'admin') return '/admin/dashboard'
    if (profile.role === 'vendor') return '/vendor/dashboard'
    if (profile.role === 'business') return '/business/dashboard'
    return '/'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] sm:max-w-[380px] bg-[var(--black-void)] border-l border-[var(--gold)]/10 p-0 flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation and account options
        </SheetDescription>

        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gold)]/10">
          {allCurrencies.length > 1 && (
            <CurrencySelector staticMode={false} className="scale-90 origin-left" />
          )}
          <button
            onClick={close}
            className="ml-auto p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--gold)]/5 transition-colors duration-200"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <motion.div
          className="flex-1 overflow-y-auto py-6 space-y-6"
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
          variants={reducedMotion ? undefined : contentVariants}
          key={isOpen ? 'open' : 'closed'}
        >
          {/* User card */}
          <MenuUserCard
            user={user}
            profile={profile}
            getInitials={getInitials}
            onClose={close}
            reducedMotion={reducedMotion}
          />

          {/* Navigate section */}
          <MenuSection label="Navigate" reducedMotion={reducedMotion}>
            <MenuNavItem href="#services" label="Services" icon={Compass} onClick={close} reducedMotion={reducedMotion} />
            <MenuNavItem href="#fleet" label="Fleet" icon={Car} onClick={close} reducedMotion={reducedMotion} />
            <MenuNavItem href="/blog" label="Blog" icon={BookOpen} onClick={close} reducedMotion={reducedMotion} />
            <MenuNavItem href="#faq" label="FAQ" icon={HelpCircle} onClick={close} reducedMotion={reducedMotion} />
            <MenuNavItem href="/contact" label="Contact" icon={Mail} onClick={close} reducedMotion={reducedMotion} />
          </MenuSection>

          {/* Account section (logged in only) */}
          {user && (
            <MenuSection label="Account" reducedMotion={reducedMotion}>
              {(!profile?.role || profile.role === 'customer') ? (
                <>
                  <MenuButtonItem label="My Profile" icon={User} onClick={() => navigate('/account?tab=personal')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="My Bookings" icon={Car} onClick={() => navigate('/account?tab=bookings')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="My Reviews" icon={Star} onClick={() => navigate('/account?tab=reviews')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="Partner With Us" icon={Building2} onClick={() => navigate('/become-vendor')} reducedMotion={reducedMotion} />
                </>
              ) : (
                <MenuButtonItem label="Go to Dashboard" icon={LayoutDashboard} onClick={() => navigate(getDashboardPath())} reducedMotion={reducedMotion} />
              )}
              <MenuButtonItem
                label="Sign Out"
                icon={LogOut}
                variant="danger"
                onClick={() => { onSignOut(); close() }}
                reducedMotion={reducedMotion}
              />
            </MenuSection>
          )}

          {/* Contact section */}
          <MenuSection label="Contact" reducedMotion={reducedMotion}>
            <MenuNavItem href="tel:+971501234567" label="+971 50 123 4567" icon={Phone} onClick={close} reducedMotion={reducedMotion} />
          </MenuSection>

          {/* Footer */}
          <MenuFooter reducedMotion={reducedMotion} />
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
