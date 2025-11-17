"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  X, 
  ImagePlus, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  label?: string
  description?: string
  value?: string | string[]
  onChange: (files: File[]) => void
  onRemove?: (index?: number) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
}

export function ImageUpload({
  label = "Upload Image",
  description,
  value,
  onChange,
  onRemove,
  multiple = false,
  maxFiles = 10,
  maxSize = 5, // 5MB default
  disabled = false,
  uploading = false,
  uploadProgress = 0,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>(() => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file count
    const currentCount = Array.isArray(value) ? value.length : (value ? 1 : 0)
    if (multiple && currentCount + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is ${maxSize}MB`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    
    if (multiple) {
      setPreviews(prev => [...prev, ...newPreviews])
    } else {
      // Revoke old preview URL to prevent memory leak
      if (previews[0] && previews[0].startsWith('blob:')) {
        URL.revokeObjectURL(previews[0])
      }
      setPreviews(newPreviews.slice(0, 1))
    }

    // Notify parent component
    onChange(validFiles)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    if (disabled || uploading) return

    // Revoke preview URL to prevent memory leak
    if (previews[index] && previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index])
    }

    setPreviews(prev => prev.filter((_, i) => i !== index))
    
    if (onRemove) {
      onRemove(index)
    }
  }

  const images = Array.isArray(value) ? value : (value ? [value] : [])
  const showUploadButton = !multiple || images.length < maxFiles

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={image}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {!disabled && !uploading && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload button and progress */}
      {showUploadButton && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          {uploading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading images...</span>
              </div>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-full sm:w-auto"
            >
              {multiple ? (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Add Images
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Max {maxSize}MB per image</span>
            </div>
            {multiple && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Max {maxFiles} images</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>JPG, PNG, WebP only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}