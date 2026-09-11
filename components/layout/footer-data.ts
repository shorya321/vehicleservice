import { Instagram, Linkedin, Facebook, Twitter, Youtube } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface FooterLinkCategory {
  title: string
  links: readonly { name: string; href: string }[]
}

export const FOOTER_BLURB =
  'Private airport and city transfers, fixed-price, worldwide. Search a route, pick a vehicle, book in minutes.'

export const FOOTER_LINK_CATEGORIES: readonly FooterLinkCategory[] = [
  {
    title: 'Navigation',
    links: [
      { name: 'Home', href: '/' },
      { name: 'Routes', href: '/routes' },
      { name: 'Fleet', href: '/#fleet' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'FAQ', href: '/#faq' },
      { name: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'Services', href: '/#services' },
      { name: 'Partner with us', href: '/become-vendor' },
      { name: 'Blog', href: '/blog' },
      { name: 'Business', href: '/business/login' },
    ],
  },
]

/**
 * The three promises that close the page.
 *
 * Every claim here is contractual, not marketing, and follows the rule set by
 * `components/checkout/trust-block.tsx`. Sources, all in
 * `app/terms/components/terms-content.tsx`:
 *  - What the fixed fare covers  -> Booking & Payment / Pricing
 *  - Free cancellation to 24h    -> Cancellation & Refund Policy
 *  - Flight tracking and waiting -> Service Delivery / Waiting Time
 *
 * Do not add a fourth entry without a Terms clause behind it.
 */
export const FOOTER_GUARANTEES = [
  {
    label: 'Fixed price',
    body: 'Vehicle, chauffeur, fuel, tolls and parking. The fare you see is the fare you pay.',
  },
  {
    label: 'Cancellation',
    body: 'Free up to 24 hours before pickup. Full refund if we cancel on you.',
  },
  {
    label: 'Airport pickup',
    body: 'We track your flight. 60 minutes of free waiting from the moment you land.',
  },
] as const

export const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
}
