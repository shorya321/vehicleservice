'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Brand Logo
        </CardTitle>
        <CardDescription>
          Upload your company logo for white-label branding (Max 2MB, JPEG/PNG/WebP/SVG)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Preview */}
        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative w-full max-w-xs mx-auto aspect-[3/1] rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
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
              className="relative w-full max-w-xs mx-auto aspect-[3/1] rounded-lg border-2 border-dashed bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload logo</p>
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
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <p className="font-medium">Logo Guidelines:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Recommended dimensions: 600x200 pixels (3:1 ratio)</li>
            <li>Use transparent backgrounds for best results (PNG or SVG)</li>
            <li>Ensure good contrast with both light and dark backgrounds</li>
            <li>Keep file size under 2MB for faster loading</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
