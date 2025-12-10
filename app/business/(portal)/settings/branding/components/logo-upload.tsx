'use client'

/**
 * Logo Upload Component
 * Upload and manage business logo with drag & drop support
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Image as ImageIcon, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LogoUploadProps {
  businessAccountId: string
  currentLogoUrl: string | null
  onLogoUpdate: (logoUrl: string | null) => void
}

export function LogoUpload({ businessAccountId, currentLogoUrl, onLogoUpdate }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must not exceed 2MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and SVG images are allowed')
      return
    }

    try {
      setIsUploading(true)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/business/branding/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload logo')
      }

      toast.success('Logo uploaded successfully')
      setPreviewUrl(result.data.logo_url)
      onLogoUpdate(result.data.logo_url)
    } catch (error) {
      console.error('Logo upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
      setPreviewUrl(currentLogoUrl)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!currentLogoUrl && !previewUrl) {
      toast.error('No logo to delete')
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch('/api/business/branding/upload', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete logo')
      }

      toast.success('Logo deleted successfully')
      setPreviewUrl(null)
      onLogoUpdate(null)
    } catch (error) {
      console.error('Logo deletion error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete logo')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Brand Logo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload your company logo for white-label branding (Max 2MB, JPEG/PNG/WebP/SVG)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Preview */}
        {previewUrl ? (
          <div className="space-y-4">
            <div className={cn(
              'relative w-full max-w-sm mx-auto aspect-[3/1] rounded-xl',
              'bg-muted border border-border',
              'flex items-center justify-center overflow-hidden'
            )}>
              <Image
                src={previewUrl}
                alt="Brand logo"
                fill
                className="object-contain p-4"
                unoptimized
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
                className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-violet-500/30 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Replace Logo
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
                className="bg-muted border-border text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Remove Logo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                'relative w-full max-w-sm mx-auto aspect-[3/1] rounded-xl',
                'border-2 border-dashed border-border',
                'bg-muted',
                'flex flex-col items-center justify-center',
                'cursor-pointer transition-all duration-300',
                'hover:border-violet-500/40 hover:bg-violet-500/5',
                'group'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={cn(
                'h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3',
                'transition-transform duration-300 group-hover:scale-110'
              )}>
                <Upload className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Click to upload logo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP, or SVG (max 2MB)
              </p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Guidelines */}
        <div className="rounded-xl bg-muted border border-border p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <p className="font-medium text-muted-foreground">Logo Guidelines</p>
          </div>
          <ul className="list-none space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
              <span>Recommended dimensions: 600x200 pixels (3:1 ratio)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
              <span>Use transparent backgrounds for best results (PNG or SVG)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
              <span>Ensure good contrast with both light and dark backgrounds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
              <span>Keep file size under 2MB for faster loading</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
