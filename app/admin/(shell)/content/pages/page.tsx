import type { Metadata } from 'next'
import { CheckCircle2, FileText, PenLine, Search } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { toCmsPage } from '@/lib/cms/server'
import { TEMPLATE_LABELS, canChangePageStatus } from '@/lib/cms/types'
import { formatBookingDate } from '@/lib/utils/timezone'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/admin/ui/stat-card'
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
      canChangeStatus: canChangePageStatus(page),
      seoDone: Boolean(seo?.meta_title && seo?.meta_description),
      updatedLabel: formatBookingDate(page.updatedAt),
    }
  })

  const published = pages.filter((p) => p.status === 'published').length
  const seoSet = pages.filter((p) => p.seoDone).length

  const pagesHeading = (
    <div className="space-y-1.5">
      <CardTitle>All Pages</CardTitle>
      <CardDescription>Manage page content and search settings</CardDescription>
    </div>
  )

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Pages', href: '/admin/content/pages' }]} />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Edit the words, images and SEO of the site&apos;s pages</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Pages"
          value={pages.length}
          hint="All site pages"
          icon={FileText}
          tone={{ disc: 'bg-primary/20', icon: 'text-primary', value: 'text-sky-700 dark:text-sky-400' }}
          delay={0.1}
        />
        <StatCard
          label="Published"
          value={published}
          hint="Live pages"
          icon={PenLine}
          tone={{ disc: 'bg-emerald-500/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' }}
          delay={0.2}
        />
        <StatCard
          label="SEO Set"
          value={seoSet}
          hint="Own title and description"
          icon={CheckCircle2}
          tone={{ disc: 'bg-sky-500/20', icon: 'text-sky-500', value: 'text-violet-600 dark:text-violet-400' }}
          delay={0.3}
        />
        <StatCard
          label="Using Defaults"
          value={pages.length - seoSet}
          hint="Fall back to site SEO"
          icon={Search}
          tone={{ disc: 'bg-amber-500/20', icon: 'text-amber-500', value: 'text-amber-700 dark:text-amber-400' }}
          delay={0.4}
        />
      </div>

      <Card>
        {error ? (
          <>
            <CardHeader>{pagesHeading}</CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">Could not load pages. Refresh to try again.</p>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-6">
            <PagesTable pages={pages} header={pagesHeading} />
          </CardContent>
        )}
      </Card>
    </AnimatedPage>
  )
}
