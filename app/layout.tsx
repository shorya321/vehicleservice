import type { Metadata } from 'next'
import { Montserrat, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider as NextThemesProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

// Infinia Luxury fonts
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
  return (
    <html lang="en" className={`${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className={`${montserrat.className} luxury-scrollbar`}>
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