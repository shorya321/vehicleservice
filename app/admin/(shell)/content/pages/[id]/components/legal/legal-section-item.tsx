'use client'

import { useWatch, type Control } from 'react-hook-form'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TiptapEditor } from '@/components/ui/tiptap-editor'
import { Input } from '@/components/ui/input'
import { TextField } from '@/components/admin/cms/text-field'
import { toAnchor, type LegalContent } from '@/lib/cms/templates/legal/schema'

interface LegalSectionItemProps {
  control: Control<LegalContent>
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}

/** One policy section, collapsed to its heading until opened. */
export function LegalSectionItem({ control, index, total, onMove, onRemove }: LegalSectionItemProps) {
  const title = useWatch({ control, name: `sections.${index}.title` })
  const anchor = useWatch({ control, name: `sections.${index}.id` })

  return (
    <AccordionItem value={`section-${index}`} className="rounded-lg border bg-card px-4">
      <div className="flex items-center gap-2">
        {/* Radix wraps the trigger in an h3, which inherits the global heading
            scale; the span resets it to row text. */}
        <AccordionTrigger className="flex-1 text-left">
          <span className="text-sm font-medium normal-case leading-normal tracking-normal">
            {index + 1}. {title || 'Untitled section'}
            <span className="ml-2 font-mono text-xs text-muted-foreground">#{anchor}</span>
          </span>
        </AccordionTrigger>
        <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete section"
          disabled={total === 1}
          onClick={() => {
            if (window.confirm(`Delete "${title || 'this section'}"? It is removed from the live page on save.`)) {
              onRemove(index)
            }
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <AccordionContent className="space-y-4 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name={`sections.${index}.title`} label="Heading (H2)" max={100} />
          <TextField control={control} name={`sections.${index}.toc_label`} label="Contents list label" max={60} />
        </div>
        <FormField
          control={control}
          name={`sections.${index}.id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link anchor</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input {...field} onChange={(e) => field.onChange(toAnchor(e.target.value))} className="font-mono" />
                </FormControl>
                <Button type="button" variant="outline" onClick={() => field.onChange(toAnchor(title ?? ''))}>
                  From heading
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Links like /page#{field.value} point here. Changing it breaks links that already use the old one.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`sections.${index}.body`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text</FormLabel>
              <FormControl>
                <TiptapEditor value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
