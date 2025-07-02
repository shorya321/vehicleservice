"use client"

import { useState, useCallback } from "react"
import { User } from "@/lib/types/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { uploadUserPhoto, deleteUserPhoto } from "../../actions"
import { useRouter } from "next/navigation"

interface PhotoUploadFormProps {
  user: User
}

export function PhotoUploadForm({ user }: PhotoUploadFormProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await uploadUserPhoto(user.id, formData)
      
      if (result.error) {
        setError(result.error)
        setPreviewUrl(null)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('Failed to upload photo')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }, [user.id, router])

  const handleDelete = async () => {
    if (!user.avatar_url) return

    setDeleting(true)
    setError(null)

    try {
      const result = await deleteUserPhoto(user.id)
      
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('Failed to delete photo')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={previewUrl || user.avatar_url || undefined} 
            alt={user.full_name || user.email}
          />
          <AvatarFallback className="text-2xl">
            {getInitials(user.full_name, user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={uploading || deleting}
              asChild
            >
              <label htmlFor="photo-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </label>
            </Button>
            
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading || deleting}
            />

            {user.avatar_url && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={uploading || deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                {deleting ? 'Deleting...' : 'Remove'}
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <p className="text-sm text-muted-foreground">
            Recommended: Square image, at least 200x200px, max 5MB
          </p>
        </div>
      </div>
    </div>
  )
}