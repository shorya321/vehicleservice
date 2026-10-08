'use client'

import { useFieldArray, type Control } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TiptapEditor } from '@/components/ui/tiptap-editor'
import { TextField } from '@/components/admin/cms/text-field'
import { MAX_SECTIONS, type BlogSection } from '@/lib/blog/sections'

interface SectionsFormValues {
  sections: BlogSection[]
}

interface BlogSectionsEditorProps {
  // Typed on the one field this editor owns, so any form that has it can pass its control.
  control: Control<SectionsFormValues>
}

/**
 * Article body as a list of sections. Each heading becomes an entry in the
 * public "On this page" list, in this order.
 */
export function BlogSectionsEditor({ control }: BlogSectionsEditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'sections' })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Content sections</h3>
        <p className="text-sm text-muted-foreground">
          Each heading is listed in the article&apos;s &quot;On this page&quot; menu. Readers click it to jump to the section.
        </p>
      </div>

      {fields.map((field, i) => (
        <div key={field.id} className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">
              <span className="mr-2 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              Section {i + 1}
            </h4>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="Move section up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move section down"
                disabled={i === fields.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove section"
                disabled={fields.length === 1}
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <TextField control={control} name={`sections.${i}.title`} label="Heading (H2)" max={120} />

          <FormField
            control={control}
            name={`sections.${i}.body`}
            render={({ field: body }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <TiptapEditor value={body.value || ''} onChange={body.onChange} tables />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_SECTIONS}
        onClick={() => append({ title: '', body: '' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add section
      </Button>
    </div>
  )
}
