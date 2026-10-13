import type { Metadata } from 'next'
import Link from 'next/link'
import { PanelBottom } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { SHARED_SECTIONS } from '@/lib/cms/blocks/types'
import { parseClosingPanel } from '@/lib/cms/blocks/closing-panel/parse'
import { formatBookingDate } from '@/lib/utils/timezone'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Shared Sections | Admin Portal',
}

/** Sections edited once and shown on several pages, each with where it appears. */
export default async function SharedSectionsPage() {
  await requireAdmin()

  const { data: rows, error } = await createAdminClient().from('cms_blocks').select('key, content, updated_at')
  if (error) {
    console.error('[cms] Failed to list shared sections:', error.message)
  }
  const byKey = new Map((rows ?? []).map((row) => [row.key, row]))

  return (
    <AnimatedPage>
      <Breadcrumb items={[{ label: 'Shared Sections' }]} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Sections</h1>
        <p className="text-muted-foreground">Edit once, and every page that shows the section updates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Each section lists the pages it appears on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SHARED_SECTIONS.map((section) => {
            const row = byKey.get(section.key)
            const content = parseClosingPanel(row?.content)
            return (
              <div key={section.key} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <PanelBottom className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{section.name}</p>
                      <Badge variant="outline">{content.visible ? 'Showing' : 'Hidden'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.usedOn}</p>
                    <p className="mt-1 truncate text-sm">Heading: {content.title}</p>
                    {row && <p className="text-xs text-muted-foreground">Updated {formatBookingDate(row.updated_at)}</p>}
                  </div>
                </div>
                <Button asChild variant="outline">
                  <Link href={section.href}>Edit</Link>
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
