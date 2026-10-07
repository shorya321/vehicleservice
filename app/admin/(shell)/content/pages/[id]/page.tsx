import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { toCmsPage } from '@/lib/cms/server'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { parseHomeContent } from '@/lib/cms/templates/home/parse'
import { getSeoSettings, rowToSeoMeta } from '@/lib/seo/server'
import { EMPTY_SEO_META } from '@/lib/seo/types'
import { titleSuffix } from '@/lib/seo/build-metadata'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getSiteSettings } from '@/lib/site-settings/server'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SeoPanel } from '@/components/admin/seo/seo-panel'
import { PageEditorTabs } from './components/page-editor-tabs'
import { PublishPageButton } from './components/publish-page-button'
import { HomeContentForm } from './components/home/home-content-form'
import { ContactContentForm } from './components/contact/contact-content-form'
import { LegalContentForm } from './components/legal/legal-content-form'
import { parseContactContent } from '@/lib/cms/templates/contact/parse'
import { parseLegalContent } from '@/lib/cms/templates/legal/parse'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'
import { DEFAULT_VENDOR_AGREEMENT_CONTENT } from '@/lib/cms/templates/legal/vendor-agreement-defaults'
import type { CmsPage } from '@/lib/cms/types'

export const metadata: Metadata = {
  title: 'Edit Page | Admin Portal',
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID_PATTERN.test(id)) {
    notFound()
  }

  const admin = createAdminClient()
  const [{ data: row }, { data: seoRow }, seoSettings, site] = await Promise.all([
    admin.from('pages').select('*').eq('id', id).maybeSingle(),
    admin
      .from('seo_meta')
      .select('meta_title, meta_description, og_image_url, canonical_path, noindex, nofollow')
      .eq('entity_type', 'page')
      .eq('entity_id', id)
      .maybeSingle(),
    getSeoSettings(),
    getSiteSettings(),
  ])

  if (!row) {
    notFound()
  }

  const page = toCmsPage(row)
  const fallback = PAGE_FALLBACKS[page.slug]
  const fallbackTitle = fallback
    ? `${fallback.title}${titleSuffix(seoSettings, site.brand_name)}`
    : seoSettings.default_title
  const fallbackDescription = fallback?.description ?? seoSettings.default_description

  const content = renderContentEditor(page)
  const isDraft = page.status === 'draft'

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Pages', href: '/admin/content/pages' }, { label: page.title }]} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
              {isDraft && <Badge variant="outline">Draft</Badge>}
            </div>
            <p className="font-mono text-sm text-muted-foreground">{page.slug}</p>
          </div>
          {/* A draft 404s publicly, so it gets Publish instead of a dead link. */}
          {isDraft ? (
            <PublishPageButton pageId={page.id} slug={page.slug} />
          ) : (
            <Button asChild variant="outline">
              <a href={page.slug} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View live page
              </a>
            </Button>
          )}
        </div>

        <PageEditorTabs
          content={content}
          seo={
            <SeoPanel
              entityType="page"
              entityId={page.id}
              initialValues={seoRow ? rowToSeoMeta(seoRow) : EMPTY_SEO_META}
              pageUrl={absoluteUrl(page.slug)}
              fallbackTitle={fallbackTitle}
              fallbackDescription={fallbackDescription}
            />
          }
        />
      </div>
    </AnimatedPage>
  )
}

/** The content form for a page's template, or a note where none exists yet. */
function renderContentEditor(page: CmsPage) {
  switch (page.template) {
    case 'home':
      return <HomeContentForm pageId={page.id} initialContent={parseHomeContent(page.content)} />
    case 'contact':
      return <ContactContentForm pageId={page.id} initialContent={parseContactContent(page.content)} />
    case 'terms':
      return <LegalContentForm pageId={page.id} initialContent={parseLegalContent(page.content, DEFAULT_TERMS_CONTENT)} />
    case 'privacy':
      return <LegalContentForm pageId={page.id} initialContent={parseLegalContent(page.content, DEFAULT_PRIVACY_CONTENT)} />
    case 'vendor-agreement':
      return (
        <LegalContentForm
          pageId={page.id}
          initialContent={parseLegalContent(page.content, DEFAULT_VENDOR_AGREEMENT_CONTENT)}
        />
      )
    default:
      return (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          This page is behind a sign-in, so its copy stays in code. Its SEO can be set in the SEO tab.
        </p>
      )
  }
}
