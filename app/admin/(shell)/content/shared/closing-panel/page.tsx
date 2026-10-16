import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseClosingPanel } from '@/lib/cms/blocks/closing-panel/parse'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ClosingPanelForm } from './components/closing-panel-form'

export const metadata: Metadata = {
  title: 'Footer Banner | Admin Portal',
}

export default async function ClosingPanelPage() {
  await requireAdmin()

  // Uncached read, so the editor always opens on what is saved.
  const { data, error } = await createAdminClient()
    .from('cms_blocks')
    .select('content')
    .eq('key', 'closing-panel')
    .maybeSingle()

  if (error) {
    console.error('[cms] Failed to load closing panel:', error.message)
  }

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Shared Sections', href: '/admin/content/shared' }, { label: 'Footer Banner' }]} />
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Footer Banner</h1>
          <p className="text-muted-foreground">Shared section above the footer on every Blog page, About and FAQ</p>
        </div>
        <ClosingPanelForm initialContent={parseClosingPanel(data?.content)} />
      </div>
    </AnimatedPage>
  )
}
