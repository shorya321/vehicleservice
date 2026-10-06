'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { uploadCmsImage } from '@/lib/cms/image-upload'

interface ImageFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  description?: string
}

/**
 * Uploads straight to storage; the old file is only deleted once the form is
 * saved without it, so an abandoned edit never breaks the live page.
 */
export function ImageField<T extends FieldValues>({ control, name, label, description }: ImageFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <ImageUpload
              value={typeof field.value === 'string' && field.value !== '' ? field.value : null}
              onChange={(url) => field.onChange(url ?? '')}
              onUpload={uploadCmsImage}
              // Clears the field only. Storage cleanup waits for the save.
              onRemove={async () => {}}
              maxSize={10}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
