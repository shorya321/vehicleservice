import type { Metadata } from 'next'
import { CheckCircle2, FileText, PenLine, Search } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { toCmsPage } from '@/lib/cms/server'
import { TEMPLATE_LABELS } from '@/lib/cms/types'
import { formatBookingDate } from '@/lib/utils/timezone'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageStatCard } from './components/page-stat-card'
import { PagesTable, type PageRowView } from './components/pages-table'

export const metadata: Metadata = {
  title: 'Pages | Admin',
  description: 'Manage page content and SEO',
}

export default async function ContentPagesPage() {
  await requireAdmin()

  const admin = createAdminClient()
  const [{ data: rows, error }, { data: seoRows }] = await Promise.all([
    admin.from('pages').select('*').order('kind', { ascending: false }).order('slug'),
    admin.from('seo_meta').select('entity_id, meta_title, meta_description').eq('entity_type', 'page'),
  ])

  if (error) {
    console.error('[cms] Failed to list pages:', error.message)
  }

  const seoById = new Map((seoRows ?? []).map((row) => [row.entity_id, row]))
  const pages: PageRowView[] = (rows ?? []).map(toCmsPage).map((page) => {
    const seo = seoById.get(page.id)
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      templateLabel: TEMPLATE_LABELS[page.template],
      status: page.status,
      seoDone: Boolean(seo?.meta_title && seo?.meta_description),
      updatedLabel: formatBookingDate(page.updatedAt),
    }
  })

  const published = pages.filter((p) => p.status === 'published').length
  const seoSet = pages.filter((p) => p.seoDone).length

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Pages', href: '/admin/content/pages' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Edit the words, images and SEO of the site&apos;s pages</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <PageStatCard
          label="Total Pages"
          value={pages.length}
          hint="All site pages"
          icon={FileText}
          tone={{ disc: 'bg-primary/20', icon: 'text-primary', value: 'text-sky-400' }}
          delay={0.1}
        />
        <PageStatCard
          label="Published"
          value={published}
          hint="Live pages"
          icon={PenLine}
          tone={{ disc: 'bg-emerald-500/20', icon: 'text-emerald-500', value: 'text-emerald-400' }}
          delay={0.2}
        />
        <PageStatCard
          label="SEO Set"
          value={seoSet}
          hint="Own title and description"
          icon={CheckCircle2}
          tone={{ disc: 'bg-sky-500/20', icon: 'text-sky-500', value: 'text-violet-400' }}
          delay={0.3}
        />
        <PageStatCard
          label="Using Defaults"
          value={pages.length - seoSet}
          hint="Fall back to site SEO"
          icon={Search}
          tone={{ disc: 'bg-amber-500/20', icon: 'text-amber-500', value: 'text-amber-400' }}
          delay={0.4}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
          <CardDescription>Manage page content and search settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive">Could not load pages. Refresh to try again.</p>
          ) : (
            <PagesTable pages={pages} />
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
