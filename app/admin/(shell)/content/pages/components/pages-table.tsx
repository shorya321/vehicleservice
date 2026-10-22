'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Edit, ExternalLink, EyeOff, FileText, Lock, MoreHorizontal, Search, Send, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsBar } from '@/components/admin/ui/bulk-actions-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'
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
import type { PageStatus } from '@/lib/cms/types'
import { PageStatusDialog, type PageStatusTarget } from './page-status-button'
import { bulkSetPageStatus } from '../actions'

export interface PageRowView {
  id: string
  title: string
  slug: string
  templateLabel: string
  status: PageStatus
  /** Offers Publish/Unpublish: see `canChangePageStatus`. */
  canChangeStatus: boolean
  seoDone: boolean
  updatedLabel: string
}

type SeoFilter = 'all' | 'set' | 'defaults'

/**
 * Filters run in the browser: there are a handful of pages, so a round trip
 * per keystroke (as the blog list does for thousands of posts) buys nothing.
 */
interface PagesTableProps {
  pages: PageRowView[]
  /** Title block shown beside the Show Filters button. */
  header?: ReactNode
}

export function PagesTable({ pages, header }: PagesTableProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [seo, setSeo] = useState<SeoFilter>('all')
  const [statusTarget, setStatusTarget] = useState<PageStatusTarget | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const query = search.trim().toLowerCase()
  const visible = pages.filter(
    (page) =>
      (!query || page.title.toLowerCase().includes(query) || page.slug.toLowerCase().includes(query)) &&
      (status === 'all' || page.status === status) &&
      (seo === 'all' || (seo === 'set') === page.seoDone)
  )

  // Only rows the filters show count, so narrowing the list drops hidden picks.
  const selectedIds = visible.filter((page) => selected.has(page.id)).map((page) => page.id)
  const isAllSelected = visible.length > 0 && selectedIds.length === visible.length
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  const hasFilters = query !== '' || status !== 'all' || seo !== 'all'
  const activeFilterCount = [query !== '', status !== 'all', seo !== 'all'].filter(Boolean).length

  return (
    <div className="space-y-4">
      <FilterToggle activeCount={activeFilterCount} header={header}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search pages" placeholder="Search pages" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={seo} onValueChange={(v) => setSeo(v as SeoFilter)}>
            <SelectTrigger aria-label="Filter by SEO status" className="w-full md:w-[200px]">
              <SelectValue placeholder="All SEO" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SEO</SelectItem>
              <SelectItem value="set">SEO set</SelectItem>
              <SelectItem value="defaults">Using defaults</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status" className="w-full md:w-[160px]">
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
      </FilterToggle>

      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          noun={['page', 'pages']}
          onClearSelection={() => setSelected(new Set())}
          onSetStatus={(publish) => bulkSetPageStatus(selectedIds, publish ? 'published' : 'draft')}
          statusWords={{ on: 'Publish', off: 'Unpublish', onDone: 'published', offDone: 'unpublished' }}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                  onCheckedChange={(checked) =>
                    setSelected(checked === true ? new Set(visible.map((page) => page.id)) : new Set())
                  }
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
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
                <TableCell colSpan={7} className="h-[300px] p-0">
                  <EmptyState icon={FileText} title="No Pages Found" description="No pages match your current filters." />
                </TableCell>
              </TableRow>
            ) : (
              visible.map((page) => (
                <TableRow key={page.id} data-state={selected.has(page.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(page.id)}
                      onCheckedChange={(checked) => handleSelect(page.id, checked === true)}
                      aria-label={`Select ${page.title}`}
                      className="translate-y-[2px]"
                    />
                  </TableCell>
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
                        {page.canChangeStatus ? (
                          <DropdownMenuItem
                            onClick={() => setStatusTarget({ id: page.id, slug: page.slug, status: page.status })}
                          >
                            {page.status === 'draft' ? (
                              <Send className="mr-2 h-4 w-4" />
                            ) : (
                              <EyeOff className="mr-2 h-4 w-4" />
                            )}
                            {page.status === 'draft' ? 'Publish' : 'Unpublish'}
                          </DropdownMenuItem>
                        ) : (
                          // Core pages render their shipped copy whatever the status, so
                          // unpublishing would hide nothing: shown, but locked.
                          <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
                            <span className="flex items-center">
                              <Lock className="mr-2 h-4 w-4" />
                              Always live
                            </span>
                            <span className="pl-6 text-xs text-muted-foreground">Core site page</span>
                          </DropdownMenuItem>
                        )}
                        {/* A draft 404s publicly, so it gets no View link. */}
                        {page.status !== 'draft' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={page.slug} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Live Page
                              </a>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PageStatusDialog page={statusTarget} onClose={() => setStatusTarget(null)} />
    </div>
  )
}
