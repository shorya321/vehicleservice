"use client"
import { motion, useReducedMotion } from "motion/react"
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'
import { FooterPanel } from './footer-panel'

interface FooterProps {
  siteSettings?: SiteSettingsConfig
}

export function Footer({ siteSettings }: FooterProps): React.JSX.Element {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  const reduceMotion = useReducedMotion()

  // `whileInView` is ALWAYS supplied. The `reduceMotion ? undefined` idiom
  // looks equivalent and is not: useReducedMotion() is false during SSR, so
  // opacity:0 is serialised into the markup and never animated back once
  // hydration flips the flag. Reduced motion collapses offset and duration.
  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  }

  return (
    // One tone step off the page ground and a single hairline. The footer
    // reads as a separate plane through tone, never through a shadow.
    <footer id="contact" className="site-footer">
      <motion.div
        className="luxury-container"
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <FooterPanel settings={settings} />
      </motion.div>
    </footer>
  )
}
