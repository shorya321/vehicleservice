'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Upload, X, Loader2, MapPin } from 'lucide-react'
import { StarRating } from './star-rating'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { reviewFormSchema, type ReviewFormData } from '@/lib/reviews/validation'
import { uploadOptimizedReviewPhotos } from '@/lib/reviews/upload'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReviewFormProps {
  bookingId: string
  bookingDetails: {
    routeFrom: string
    routeTo: string
    date: string
    vehicleClass: string
  }
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel?: () => void
  className?: string
  initialData?: {
    rating: number
    reviewText: string
    photos: string[]
  }
}

export function ReviewForm({
  bookingId,
  bookingDetails,
  onSubmit,
  onCancel,
  className,
  initialData,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialData?.photos || [])
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      bookingId,
      rating: initialData?.rating || 0,
      reviewText: initialData?.reviewText || '',
      photos: initialData?.photos || [],
    },
  })

  const rating = watch('rating')
  const reviewText = watch('reviewText') || ''
  const remainingChars = 1000 - reviewText.length

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    if (uploadedPhotos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    setIsUploading(true)

    try {
      const { urls, errors } = await uploadOptimizedReviewPhotos(files, bookingId)

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error))
      }

      if (urls.length > 0) {
        const newPhotos = [...uploadedPhotos, ...urls]
        setUploadedPhotos(newPhotos)
        setValue('photos', newPhotos)
        toast.success(`${urls.length} photo(s) uploaded successfully`)
      }
    } catch (error) {
      toast.error('Failed to upload photos')
    } finally {
      setIsUploading(false)
      e.target.value = '' // Reset input
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index)
    setUploadedPhotos(newPhotos)
    setValue('photos', newPhotos)
  }

  const handleFormSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)

    try {
      await onSubmit(data)
    } catch (error) {
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className={cn(
        'p-8',
        className
      )}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Booking Details */}
        <div className="p-4 bg-muted/50 border rounded-lg">
          <h3 className="text-sm font-medium text-luxury-gold mb-2">Booking Details</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {bookingDetails.routeFrom} → {bookingDetails.routeTo}
              </span>
            </div>
            <p>Vehicle: {bookingDetails.vehicleClass}</p>
            <p>Date: {bookingDetails.date}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Rating <span className="text-luxury-gold">*</span>
          </label>
          <StarRating
            rating={rating}
            interactive
            onChange={(newRating) => setValue('rating', newRating)}
            size="lg"
          />
          {errors.rating && (
            <p className="text-sm text-red-500">{errors.rating.message}</p>
          )}
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Your Review (Optional)
          </label>
          <Textarea
            {...register('reviewText')}
            placeholder="Share your experience with other travelers..."
            className="min-h-[150px]"
            maxLength={1000}
          />
          <div className="flex justify-between text-xs">
            {errors.reviewText && (
              <p className="text-red-500">{errors.reviewText.message}</p>
            )}
            <p
              className={cn(
                'ml-auto text-muted-foreground',
                remainingChars < 100 && 'text-luxury-gold'
              )}
            >
              {remainingChars} characters remaining
            </p>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Photos (Optional - Max 5)
          </label>

          {/* Uploaded Photos */}
          {uploadedPhotos.length > 0 && (
            <div className="grid grid-cols-5 gap-3">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-square group">
                  <Image
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {uploadedPhotos.length < 5 && (
            <div>
              <input
                type="file"
                id="photo-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="photo-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  disabled={isUploading}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos ({uploadedPhotos.length}/5)
                    </>
                  )}
                </Button>
              </label>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex-1 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
