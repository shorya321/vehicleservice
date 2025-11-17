'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, X } from 'lucide-react'
import { adminResponseSchema } from '@/lib/reviews/validation'
import { addAdminResponse } from '@/app/admin/reviews/actions'
import { toast } from 'sonner'

type AdminResponseFormData = z.infer<typeof adminResponseSchema>

interface AdminResponseFormProps {
  reviewId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AdminResponseForm({ reviewId, onSuccess, onCancel }: AdminResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AdminResponseFormData>({
    resolver: zodResolver(adminResponseSchema),
    defaultValues: {
      reviewId,
      response: '',
    },
  })

  const responseText = watch('response')
  const charCount = responseText?.length || 0
  const maxChars = 500

  const onSubmit = async (data: AdminResponseFormData) => {
    try {
      setIsSubmitting(true)
      const result = await addAdminResponse(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Response added successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to add response')
      console.error('Admin response error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 bg-luxury-darkGray/30 border border-luxury-lightGray/10 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-luxury-gold" />
          <h4 className="text-sm font-medium text-luxury-pearl">Add Admin Response</h4>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-luxury-lightGray hover:text-luxury-pearl transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Textarea
            {...register('response')}
            placeholder="Write a professional response to this review..."
            className="min-h-[100px] bg-luxury-black/30 border-luxury-lightGray/20 focus:border-luxury-gold text-luxury-pearl resize-none"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.response && (
              <p className="text-xs text-red-400">{errors.response.message}</p>
            )}
            <p
              className={`text-xs ml-auto ${
                charCount > maxChars
                  ? 'text-red-400'
                  : charCount > maxChars * 0.9
                    ? 'text-yellow-500'
                    : 'text-luxury-lightGray'
              }`}
            >
              {charCount} / {maxChars}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || charCount === 0 || charCount > maxChars}
            className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black"
          >
            {isSubmitting ? 'Sending...' : 'Send Response'}
          </Button>
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
