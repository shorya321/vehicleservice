import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, FileText, Pencil } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { toCmsPage } from '@/lib/cms/server'
import { TEMPLATE_LABELS } from '@/lib/cms/types'
import { formatBookingDateTime } from '@/lib/utils/timezone'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata: Metadata = {
  title: 'Pages | Admin Portal',
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

  const pages = (rows ?? []).map(toCmsPage)
  const seoById = new Map((seoRows ?? []).map((row) => [row.entity_id, row]))

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Edit the words, images and SEO of the site&apos;s pages. Layout and design stay fixed.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {error ? (
              <p className="p-6 text-sm text-destructive">Could not load pages. Refresh to try again.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SEO</TableHead>
                    <TableHead>Last edited</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => {
                    const seo = seoById.get(page.id)
                    const seoDone = Boolean(seo?.meta_title && seo?.meta_description)
                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {page.title}
                          </div>
                          <p className="text-xs text-muted-foreground">{TEMPLATE_LABELS[page.template]}</p>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{page.slug}</TableCell>
                        <TableCell>
                          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={seoDone ? 'default' : 'outline'}>{seoDone ? 'Set' : 'Defaults'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatBookingDateTime(page.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <a href={page.slug} target="_blank" rel="noopener noreferrer" aria-label={`View ${page.title}`}>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/admin/content/pages/${page.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  )
}
