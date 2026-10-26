'use client'

/**
 * Favicon Upload Component
 * The portal's browser-tab icon. With no upload, the tab shows the business
 * initials in the brand colour, previewed here live as the colour changes.
 *
 * SCOPE: Business module ONLY
 */

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/business/ui/button'
import { AppWindow, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { monogramFaviconDataUri } from '@/lib/business/favicon'

interface FaviconUploadProps {
  currentFaviconUrl: string | null
  businessName: string
  primaryColor: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
const ENDPOINT = '/api/business/branding/favicon'

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error || fallback
  } catch {
    return fallback
  }
}

export function FaviconUpload({ currentFaviconUrl, businessName, primaryColor }: FaviconUploadProps): React.JSX.Element {
  const router = useRouter()
  const [faviconUrl, setFaviconUrl] = useState<string | null>(currentFaviconUrl)
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewSrc = faviconUrl ?? monogramFaviconDataUri(businessName, primaryColor)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must not exceed 2MB')
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only PNG, SVG and ICO images are allowed')
      return
    }

    setBusy('upload')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(ENDPOINT, { method: 'POST', body: formData })
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to upload favicon'))
      }
      const result = (await response.json()) as { data: { favicon_url: string } }
      setFaviconUrl(result.data.favicon_url)
      toast.success('Favicon uploaded successfully')
      router.refresh()
    } catch (error) {
      console.error('Favicon upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload favicon')
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async (): Promise<void> => {
    setBusy('delete')
    try {
      const response = await fetch(ENDPOINT, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to delete favicon'))
      }
      setFaviconUrl(null)
      toast.success('Favicon removed. The tab now shows your initials.')
      router.refresh()
    } catch (error) {
      console.error('Favicon deletion error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete favicon')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <AppWindow className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Favicon
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              The icon in the browser tab. Without one, your initials are shown in your brand colour.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-xl bg-muted border border-border px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URI or arbitrary upload, shown at tab size */}
          <img src={previewSrc} alt="" width={32} height={32} className="h-8 w-8 rounded object-contain" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{faviconUrl ? 'Custom favicon' : 'Initials icon'}</p>
            <p className="text-xs text-muted-foreground">Square PNG 512 x 512, SVG or ICO. Max 2MB.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-primary/30 disabled:opacity-50"
          >
            {busy === 'upload' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {faviconUrl ? 'Replace' : 'Upload'}
          </Button>
          {faviconUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={busy !== null}
              className="bg-muted border-border text-destructive hover:bg-destructive/10 hover:border-destructive/30 disabled:opacity-50"
            >
              {busy === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
