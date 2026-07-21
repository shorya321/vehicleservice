'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, Trash2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { uploadBusinessAvatar, deleteBusinessAvatar } from '../actions/avatar'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  displayName: string | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function AvatarUpload({ currentAvatarUrl, displayName }: AvatarUploadProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvedName = displayName || 'User'

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    try {
      setIsUploading(true)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadBusinessAvatar(formData)

      if (result.error) {
        toast.error(result.error)
        setPreviewUrl(currentAvatarUrl)
        return
      }

      toast.success('Profile photo updated')
      router.refresh()
    } catch {
      toast.error('Failed to upload photo')
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const result = await deleteBusinessAvatar()

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Profile photo removed')
      setPreviewUrl(null)
      router.refresh()
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Profile Photo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload a profile picture (Max 5MB, JPEG/PNG/WebP)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-primary/20">
              {previewUrl && (
                <AvatarImage src={previewUrl} alt={resolvedName} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-semibold">
                {getInitials(resolvedName)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full',
                'bg-black/50 opacity-0 group-hover:opacity-100',
                'transition-opacity duration-200',
                'disabled:cursor-not-allowed'
              )}
            >
              <Upload className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {previewUrl ? 'Change Photo' : 'Upload Photo'}
                </>
              )}
            </Button>
            {previewUrl && (
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
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Photo
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
