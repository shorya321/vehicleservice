import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider as NextThemesProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { hexToHsl } from '@/lib/business/branding-utils'

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
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.infiniatransfers.com'),
  title: {
    default: 'Infinia Transfers — Airport & City Transfers, Fixed-Price',
    template: '%s | Infinia Transfers',
  },
  description: 'Book private airport and city transfers in 47 cities. Fixed pricing, meet-and-greet included, confirmed in under 90 seconds.',
  openGraph: {
    type: 'website',
    siteName: 'Infinia Transfers',
    title: 'Infinia Transfers — Airport & City Transfers, Fixed-Price',
    description: 'Book private airport and city transfers in 47 cities. Fixed pricing, meet-and-greet included, confirmed in under 90 seconds.',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
