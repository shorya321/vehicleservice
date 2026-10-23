'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Re-runs the dashboard's server queries without a full page reload. */
export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={cn('mr-2 h-4 w-4', isPending && 'animate-spin')} />
      {isPending ? 'Refreshing' : 'Refresh'}
    </Button>
  )
}
