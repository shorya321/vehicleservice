'use client'

import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  /** Hard limit, enforced by the schema. The counter turns red past it. */
  max: number
  /** Soft limit, e.g. where Google truncates. The counter turns amber past it. */
  recommended?: number
  rows?: number
  description?: string
  placeholder?: string
}

function counterTone(length: number, max: number, recommended?: number): string {
  if (length > max) return 'text-destructive'
  if (recommended && length > recommended) return 'text-amber-500'
  return 'text-muted-foreground'
}

/** Plain-text input or textarea with a live character counter. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  max,
  recommended,
  rows,
  description,
  placeholder,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === 'string' ? field.value : ''
        return (
          <FormItem>
            <div className="flex items-baseline justify-between gap-3">
              <FormLabel>{label}</FormLabel>
              <span className={cn('text-xs tabular-nums', counterTone(value.length, max, recommended))}>
                {value.length}/{recommended ?? max}
              </span>
            </div>
            <FormControl>
              {rows ? (
                <Textarea {...field} value={value} rows={rows} placeholder={placeholder} />
              ) : (
                <Input {...field} value={value} placeholder={placeholder} />
              )}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
