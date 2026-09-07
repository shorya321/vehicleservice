'use client'

import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useReducedMotion } from 'motion/react'
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
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MobileMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: SupabaseUser | null
  profile: Profile | null
  getInitials: (profile: Profile | null) => string
  onSignOut: () => void
  siteSettings?: SiteSettingsConfig
}

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
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
  siteSettings,
}: MobileMenuProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  const router = useRouter()
  const pathname = usePathname()
  const reducedMotion = useReducedMotion() ?? false

  /* The desktop header has marked the current page via aria-current all along;
     the drawer never did. Hash links and tel: links have no page of their own,
     so they never match rather than matching the wrong thing. */
  const isCurrent = (href: string) => {
    if (href.includes('#') || href.startsWith('tel:')) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

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
        className="w-[85vw] sm:max-w-[380px] bg-[var(--black-void)] border-l border-[rgba(var(--gold-rgb),0.1)] p-0 flex flex-col [&>button]:hidden overflow-hidden"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation and account options
        </SheetDescription>

        {/* Ambient gold glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(198,170,136,0.06) 0%, transparent 70%)' }}
        />

        {/* Header row */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[rgba(var(--gold-rgb),0.1)]">
          <Link href="/" onClick={close} className="footer-logo text-xl hover:opacity-80 transition-opacity duration-300">
            {settings.brand_name.includes(' ') ? (
              <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
            ) : settings.brand_name}
          </Link>
          <button
            onClick={close}
            className="p-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--gold-rgb),0.05)] active:bg-[rgba(var(--gold-rgb),0.09)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <motion.div
          className="flex-1 overflow-y-auto pt-5 pb-2 space-y-7"
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
          variants={reducedMotion ? undefined : contentVariants}
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
            <MenuNavItem href="/#services" label="Services" icon={Compass} onClick={close} reducedMotion={reducedMotion} active={isCurrent('/#services')} />
            <MenuNavItem href="/#fleet" label="Fleet" icon={Car} onClick={close} reducedMotion={reducedMotion} active={isCurrent('/#fleet')} />
            <MenuNavItem href="/blog" label="Blog" icon={BookOpen} onClick={close} reducedMotion={reducedMotion} active={isCurrent('/blog')} />
            <MenuNavItem href="/#faq" label="FAQ" icon={HelpCircle} onClick={close} reducedMotion={reducedMotion} active={isCurrent('/#faq')} />
            <MenuNavItem href="/contact" label="Contact" icon={Mail} onClick={close} reducedMotion={reducedMotion} active={isCurrent('/contact')} />
          </MenuSection>

          {/* Account section (logged in only) */}
          {user && (
            <MenuSection label="Account" reducedMotion={reducedMotion}>
              {(!profile?.role || profile.role === 'customer') ? (
                <>
                  <MenuButtonItem label="My Profile" icon={User} onClick={() => navigate('/account?tab=personal')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="My Bookings" icon={Car} onClick={() => navigate('/account?tab=bookings')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="My Reviews" icon={Star} onClick={() => navigate('/account?tab=reviews')} reducedMotion={reducedMotion} />
                  <MenuButtonItem label="Partner With Us" icon={Building2} onClick={() => navigate('/become-vendor')} reducedMotion={reducedMotion} active={isCurrent('/become-vendor')} />
                </>
              ) : (
                <MenuButtonItem label="Go to Dashboard" icon={LayoutDashboard} onClick={() => navigate(getDashboardPath())} reducedMotion={reducedMotion} />
              )}
              {/* Held off from the routine rows by a hairline. The three
                  /account rows above all share one pathname, so none of them
                  takes an active mark: it would light all three at once. */}
              <MenuButtonItem
                label="Sign Out"
                icon={LogOut}
                variant="danger"
                separated
                onClick={() => { onSignOut(); close() }}
                reducedMotion={reducedMotion}
              />
            </MenuSection>
          )}

          {/* Contact section */}
          <MenuSection label="Contact" reducedMotion={reducedMotion}>
            <MenuNavItem href={`tel:${settings.support_phone.replace(/\s/g, '')}`} label={settings.support_phone} icon={Phone} variant="phone" onClick={close} reducedMotion={reducedMotion} />
          </MenuSection>

          {/* Footer */}
          <MenuFooter reducedMotion={reducedMotion} siteSettings={settings} />
        </motion.div>

        {/* Primary action, pinned below the scroll area. The drawer used to end
            at the Contact section, so under `lg` the booking CTA did not exist
            anywhere in the interface: not in the bar, not in the menu. */}
        <div className="relative shrink-0 border-t border-[rgba(var(--gold-rgb),0.1)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            href="/#services"
            onClick={close}
            className="btn-cta-header flex h-12 w-full"
          >
            Book Transfer
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
