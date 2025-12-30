import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit, Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider as NextThemesProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { hexToHsl } from '@/lib/business/branding-utils'

// Infinia Luxury fonts - "Midnight Opulence" theme
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
})

// Business portal fonts
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

export const metadata: Metadata = {
  title: 'Vehicle Service - Premier Luxury Transportation',
  description: 'Experience unparalleled luxury, comfort, and reliability with our premier vehicle services',
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
      className={`${cormorant.variable} ${outfit.variable} ${inter.variable} ${plusJakartaSans.variable}`}
      style={themeStyles}
      suppressHydrationWarning
    >
      <body className={`${outfit.className} luxury-scrollbar`}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
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