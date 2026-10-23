import Link from 'next/link'
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AttentionItem, AttentionTone } from '@/lib/dashboard/attention'

interface NeedsAttentionCardProps {
  items: AttentionItem[]
  error: string | null
}

const TONE_CLASS: Record<AttentionTone, string> = {
  urgent: 'admin-attention-urgent',
  waiting: 'admin-attention-waiting',
  review: 'admin-attention-review',
}

export function NeedsAttentionCard({ items, error }: NeedsAttentionCardProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="admin-card-hover admin-card-untinted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
          <CardDescription className="mt-0.5">Only queues with work waiting</CardDescription>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            {total}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-2">
        {error ? (
          <div className="flex items-center gap-3 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load the work queues. Refresh to try again.
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Nothing needs attention</span>
              <span className="text-xs text-muted-foreground">Every queue is clear.</span>
            </span>
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={cn('admin-attention-row', TONE_CLASS[item.tone])}>
                  <span className="admin-attention-dot" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
