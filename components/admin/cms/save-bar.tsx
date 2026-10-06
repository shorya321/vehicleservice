'use client'

import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveBarProps {
  saving: boolean
  dirty: boolean
}

/** Sticky footer with the publish button, shared by the page editors. */
export function SaveBar({ saving, dirty }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-background/95 py-4 backdrop-blur">
      {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save and publish
      </Button>
    </div>
  )
}

/** Tab trigger classes that stay visible on the dark admin ground. */
export const EDITOR_TAB_TRIGGER =
  'border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10'
