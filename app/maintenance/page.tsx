import type { Metadata } from 'next'
import Image from 'next/image'
import { Wrench } from 'lucide-react'
import { getSiteSettings } from '@/lib/site-settings/server'

export const metadata: Metadata = {
  title: 'Under Maintenance',
  description: 'The site is temporarily unavailable for scheduled maintenance.',
  robots: { index: false, follow: false },
}

export default async function MaintenancePage() {
  const settings = await getSiteSettings()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(198,170,136,0.10),transparent_65%)]"
      />

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Brand */}
        <div className="flex justify-center">
          {settings.header_logo_url ? (
            <Image
              src={settings.header_logo_url}
              alt={settings.brand_name}
              width={200}
              height={56}
              priority
              className="h-12 w-auto object-contain"
            />
          ) : (
            <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight text-foreground">
              {settings.brand_name}
            </span>
          )}
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold-text)] dark:text-[var(--gold)]">
            <Wrench className="h-9 w-9" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            We&rsquo;ll be back shortly
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Our site is temporarily down for scheduled maintenance. We&rsquo;re
            working to bring it back as quickly as possible. Thank you for your
            patience.
          </p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {settings.copyright_text}
          </p>
        </div>
      </div>
    </div>
  )
}
