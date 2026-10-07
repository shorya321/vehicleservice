'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EyeOff, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { PageStatus } from '@/lib/cms/types'
import { setPageStatus } from '../actions'

export interface PageStatusTarget {
  id: string
  slug: string
  status: PageStatus
}

interface PageStatusDialogProps {
  /** The page to flip, or null when closed. */
  page: PageStatusTarget | null
  onClose: () => void
}

/** Confirms a publish or unpublish, then runs it. Shared by the list and the editor. */
export function PageStatusDialog({ page, onClose }: PageStatusDialogProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // The dialog animates out after `page` turns null; keep its last text meanwhile.
  const [shown, setShown] = useState<PageStatusTarget | null>(page)
  if (page && page !== shown) {
    setShown(page)
  }
  const publishing = shown?.status === 'draft'

  function handleConfirm(): void {
    if (!page) return
    const next: PageStatus = publishing ? 'published' : 'draft'
    startTransition(async () => {
      const result = await setPageStatus(page.id, next)
      if (!result.success) {
        toast.error(result.error ?? 'Could not update the page. Try again.')
        return
      }
      toast.success(next === 'published' ? 'Page published' : 'Page unpublished')
      onClose()
      router.refresh()
    })
  }

  return (
    <AlertDialog open={page !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{publishing ? 'Publish this page?' : 'Unpublish this page?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {publishing
              ? `${shown?.slug} becomes public and is linked from the site. Save any edits first: the saved copy is what goes live.`
              : `${shown?.slug} stops being public and visitors get a not found page. You can publish it again at any time.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {publishing ? 'Publish' : 'Unpublish'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** The editor header's Publish or Unpublish button. */
export function PageStatusButton({ page }: { page: PageStatusTarget }) {
  const [target, setTarget] = useState<PageStatusTarget | null>(null)
  const publishing = page.status === 'draft'

  return (
    <>
      <Button variant={publishing ? 'default' : 'outline'} onClick={() => setTarget(page)}>
        {publishing ? <Send className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
        {publishing ? 'Publish' : 'Unpublish'}
      </Button>
      <PageStatusDialog page={target} onClose={() => setTarget(null)} />
    </>
  )
}
