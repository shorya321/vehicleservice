'use client'

import { motion, type Variants } from 'motion/react'
import { Instagram, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'

interface MenuFooterProps {
  reducedMotion?: boolean
  siteSettings?: SiteSettingsConfig
}

const footerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 } },
}

const SOCIAL_ICON_MAP: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
}

export function MenuFooter({ reducedMotion, siteSettings }: MenuFooterProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS

  const activeSocialLinks = Object.entries(settings.social_links)
    .filter(([, url]) => url && url.length > 0)
    .map(([platform, url]) => ({ platform, url, Icon: SOCIAL_ICON_MAP[platform] }))
    .filter((link): link is typeof link & { Icon: typeof Instagram } => !!link.Icon)

  return (
    <motion.div
      className="pt-1 px-4"
      variants={reducedMotion ? undefined : footerVariants}
    >
      {/* Inline gradient for the same reason as the user card's seam: the
          `via-[var(--gold)]/30` form compiled to nothing. */}
      <div
        className="h-px mb-4"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(var(--gold-rgb),0.35), transparent)',
        }}
      />
      <p className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)] text-center">
        Premium Transfer Services
      </p>
      {/* Kept, but demoted: the wordmark also opens the drawer, so down here it
          reads as a sign-off rather than a second masthead. */}
      <p className="footer-logo text-base text-center mt-1 opacity-75">
        {settings.brand_name.includes(' ') ? (
          <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
        ) : settings.brand_name}
      </p>
      {activeSocialLinks.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          {activeSocialLinks.map(({ platform, url, Icon }) => (
            /* The 44px touch target stays; only the drawn circle shrinks to
               36px. Social is the lowest-value action here and used to be the
               heaviest object on the screen, but hierarchy is not a reason to
               drop below the tap-target floor. */
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              className="group h-11 w-11 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            >
              <span className="h-9 w-9 flex items-center justify-center rounded-full border border-[rgba(var(--gold-rgb),0.18)] text-[var(--text-muted)] transition-colors duration-200 group-hover:border-[rgba(var(--gold-rgb),0.45)] group-hover:text-[var(--gold-text)] group-active:bg-[rgba(var(--gold-rgb),0.08)]">
                <Icon className="w-4 h-4" strokeWidth={1.6} />
              </span>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] font-body text-[var(--text-muted)] opacity-75 text-center mt-3 pb-2" suppressHydrationWarning>
        &copy; {new Date().getFullYear()} {settings.copyright_text}
      </p>
    </motion.div>
  )
}
