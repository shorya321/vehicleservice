'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string | null
  onChange: (value: string | null) => void
  onUpload: (file: File) => Promise<string>
  onRemove?: (url: string) => Promise<void>
  disabled?: boolean
  className?: string
  accept?: string
  maxSize?: number // in MB
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  disabled = false,
  className,
  accept = 'image/*',
  maxSize = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxSize) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!value || !onRemove) return

    setIsRemoving(true)
    try {
      await onRemove(value)
      onChange(null)
      toast.success('Image removed successfully')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove image')
    } finally {
      setIsRemoving(false)
    }
  }

  const isLoading = isUploading || isRemoving

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isLoading}
        className="hidden"
      />

      {value ? (
        <div className="relative group w-32 h-32">
          <div className="relative w-full h-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="128px"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          {!disabled && !isLoading && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          className={cn(
            'relative flex flex-col items-center justify-center w-32 h-32',
            'border-2 border-dashed rounded-lg',
            'hover:bg-accent hover:border-accent-foreground/50',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Max {maxSize}MB
              </p>
            </>
          )}
        </button>
      )}
    </div>
  )
}