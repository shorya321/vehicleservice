import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider as NextThemesProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { hexToHsl } from '@/lib/business/branding-utils'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getSeoSettings } from '@/lib/seo/server'
import { titleSuffix } from '@/lib/seo/build-metadata'
import { getSiteUrl } from '@/lib/seo/site-url'
import { loadBookingTimezone } from '@/lib/site-settings/timezone'
import { BookingTimezoneSync } from '@/components/booking-timezone-sync'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  // Only admin and business CSS use Jakarta and Playfair. Without preload they
  // still load on those routes, but the public pages stop fetching them up front.
  preload: false,
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
})

export async function generateMetadata(): Promise<Metadata> {
  // Site-wide noindex while pre-launch demo content is blocked from crawlers.
  const [{ block_search_indexing, brand_name }, seo] = await Promise.all([getSiteSettings(), getSeoSettings()])
  const verification = {
    ...(seo.google_verification ? { google: seo.google_verification } : {}),
    ...(seo.bing_verification ? { other: { 'msvalidate.01': seo.bing_verification } } : {}),
  }

  // Defaults only. Public pages set their own title, description, canonical and
  // share image through lib/seo; the template covers any page that still
  // exports a bare title string.
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: seo.default_title,
      template: `%s${titleSuffix(seo, brand_name)}`,
    },
    description: seo.default_description,
    openGraph: {
      type: 'website',
      siteName: brand_name,
      title: seo.default_title,
      description: seo.default_description,
      ...(seo.default_og_image_url ? { images: [{ url: seo.default_og_image_url }] } : {}),
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
    ...(block_search_indexing ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Applies the stored operating timezone to this render on the server, and
  // yields the value to hand the browser. Every date on the site depends on it,
  // so it is resolved here rather than per route.
  const timeZone = await loadBookingTimezone()

  // Read branding headers injected by middleware for custom domain white-labeling
  const headersList = await headers()
  const customDomain = headersList.get('x-custom-domain') === 'true'
  const primaryColor = headersList.get('x-primary-color')
  const secondaryColor = headersList.get('x-secondary-color')
  const accentColor = headersList.get('x-accent-color')
  const brandName = headersList.get('x-brand-name')
  const logoUrl = headersList.get('x-logo-url')
  const pathname = headersList.get('x-pathname') || ''
  const isPortalRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/become-vendor') ||
    pathname.startsWith('/business')
  const customerFontClass = isPortalRoute ? '' : 'site-font'

  // Create dynamic CSS custom properties for white-label theming
  // Convert hex colors to HSL format for Tailwind compatibility
  // These will override the default theme colors when a custom domain is detected
  const themeStyles: React.CSSProperties = customDomain && primaryColor ? {
    '--primary': hexToHsl(primaryColor),
    '--primary-foreground': '0 0% 100%', // white
    '--secondary': secondaryColor ? hexToHsl(secondaryColor) : hexToHsl('#1e40af'),
    '--secondary-foreground': '0 0% 100%', // white
    '--accent': accentColor ? hexToHsl(accentColor) : hexToHsl('#8b5cf6'),
    '--accent-foreground': '0 0% 100%', // white
  } as React.CSSProperties : {}

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable}`}
      style={themeStyles}
      suppressHydrationWarning
    >
      <body className={`${inter.className} ${customerFontClass} luxury-scrollbar`} suppressHydrationWarning>
        {/* Before anything that renders a date. */}
        <BookingTimezoneSync timeZone={timeZone} />
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'luxury-toast',
                title: 'luxury-toast-title',
                description: 'luxury-toast-description',
                actionButton: 'luxury-toast-action',
                closeButton: 'luxury-toast-close',
                info: 'luxury-toast-info',
                success: 'luxury-toast-success',
                error: 'luxury-toast-error',
                warning: 'luxury-toast-warning',
              },
            }}
          />
        </NextThemesProvider>
      </body>
    </html>
  )
}
