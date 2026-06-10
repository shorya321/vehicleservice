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
      className="mt-auto pt-4 px-3"
      variants={reducedMotion ? undefined : footerVariants}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent mb-4" />
      <p className="text-[10px] font-body tracking-[0.2em] uppercase text-[var(--text-muted)] text-center">
        Premium Transfer Services
      </p>
      <p className="footer-logo text-lg text-center mt-1">
        {settings.brand_name.includes(' ') ? (
          <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
        ) : settings.brand_name}
      </p>
      {activeSocialLinks.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-3">
          {activeSocialLinks.map(({ platform, url, Icon }) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              className="footer-social p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--gold-text)] hover:bg-[var(--gold)]/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] font-body text-[var(--text-muted)]/60 text-center mt-3 pb-2" suppressHydrationWarning>
        &copy; {new Date().getFullYear()} {settings.copyright_text}
      </p>
    </motion.div>
  )
}
