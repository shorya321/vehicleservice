import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { getSeoSettings } from '@/lib/seo/server'
import { getSiteUrl } from '@/lib/seo/site-url'
import { getSiteSettings } from '@/lib/site-settings/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { SeoSettingsForm } from './components/seo-settings-form'

export const metadata: Metadata = {
  title: 'SEO | Admin Portal',
}

export default async function SeoSettingsPage() {
  await requireAdmin()
  const [settings, site] = await Promise.all([getSeoSettings(), getSiteSettings()])

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO</h1>
          <p className="text-muted-foreground">
            Site-wide search defaults. Set a page&apos;s own title and description from its SEO tab under{' '}
            <Link href="/admin/content/pages" className="underline underline-offset-4">
              Pages
            </Link>
            .
          </p>
        </div>

        {site.block_search_indexing && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-card p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p>
              Search engines are blocked site-wide. Nothing will be indexed until you turn off{' '}
              <Link href="/admin/settings/general" className="underline underline-offset-4">
                Block search indexing
              </Link>{' '}
              in General settings.
            </p>
          </div>
        )}

        <SeoSettingsForm initialValues={settings} brandName={site.brand_name} siteUrl={getSiteUrl()} />
      </div>
    </AnimatedPage>
  )
}
