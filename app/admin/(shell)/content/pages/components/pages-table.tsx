'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, ExternalLink, FileText, MoreHorizontal, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface PageRowView {
  id: string
  title: string
  slug: string
  templateLabel: string
  status: string
  seoDone: boolean
  updatedLabel: string
}

type SeoFilter = 'all' | 'set' | 'defaults'

/**
 * Filters run in the browser: there are a handful of pages, so a round trip
 * per keystroke (as the blog list does for thousands of posts) buys nothing.
 */
export function PagesTable({ pages }: { pages: PageRowView[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [seo, setSeo] = useState<SeoFilter>('all')

  const query = search.trim().toLowerCase()
  const visible = pages.filter(
    (page) =>
      (!query || page.title.toLowerCase().includes(query) || page.slug.toLowerCase().includes(query)) &&
      (status === 'all' || page.status === status) &&
      (seo === 'all' || (seo === 'set') === page.seoDone)
  )
  const hasFilters = query !== '' || status !== 'all' || seo !== 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pages" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={seo} onValueChange={(v) => setSeo(v as SeoFilter)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All SEO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SEO</SelectItem>
            <SelectItem value="set">SEO set</SelectItem>
            <SelectItem value="defaults">Using defaults</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Clear filters"
            onClick={() => {
              setSearch('')
              setStatus('all')
              setSeo('all')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Last edited</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[300px] p-0">
                  <EmptyState icon={FileText} title="No Pages Found" description="No pages match your current filters." />
                </TableCell>
              </TableRow>
            ) : (
              visible.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="max-w-[250px] font-medium">
                    <Link href={`/admin/content/pages/${page.id}`} className="block hover:text-primary">
                      <p className="truncate">{page.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{page.slug}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{page.templateLabel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{page.seoDone ? 'Set' : 'Defaults'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{page.updatedLabel}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/content/pages/${page.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a href={page.slug} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Live Page
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
