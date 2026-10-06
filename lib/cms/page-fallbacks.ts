/**
 * Title and description each system page uses when its SEO record leaves them
 * empty. Titles carry no brand: the site suffix is added once, by
 * `composeMetadata`. Shared by the public page and its admin SEO panel, so the
 * preview placeholder is what the page really renders.
 *
 * The home page has none: it falls back to the site default title and
 * description from Admin > SEO.
 */
export const PAGE_FALLBACKS: Readonly<Record<string, { title: string; description: string }>> = {
  '/contact': {
    title: 'Contact Us',
    description:
      'Get in touch with Infinia Transfers for luxury vehicle transfer services in Dubai. Our concierge team is available around the clock.',
  },
  '/terms': {
    title: 'Terms & Conditions',
    description: 'Terms of service for booking private airport and city transfers through Infinia Transfers.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description:
      'How Infinia Transfers collects, uses, and protects your personal data when you book private airport and city transfers.',
  },
  '/become-vendor': {
    title: 'Become a Vendor',
    description: 'Apply to list your vehicles and start your rental business with us.',
  },
}
