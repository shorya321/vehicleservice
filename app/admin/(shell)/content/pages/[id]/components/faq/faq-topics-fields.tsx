'use client'

import { useFieldArray, type Control, type FieldPath } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/admin/cms/text-field'
import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { MAX_FAQ_TOPICS, type FaqContent } from '@/lib/cms/templates/faq/schema'

const p = (value: string): FieldPath<FaqContent> => value as FieldPath<FaqContent>

/** Topics in page order, each with its own question list. */
export function FaqTopicsFields({ control }: { control: Control<FaqContent> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'topics' })

  return (
    <div className="space-y-6">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Each topic becomes a heading on the page and an entry in the side menu, in this order.
      </p>

      {fields.map((field, i) => (
        <section key={field.id} className="space-y-4 rounded-lg border bg-card/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Topic {i + 1}</h3>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" aria-label="Move topic up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move topic down"
                disabled={i === fields.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete topic"
                disabled={fields.length === 1}
                onClick={() => remove(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={control} name={p(`topics.${i}.name`)} label="Topic name (H2)" max={40} />
            <TextField control={control} name={p(`topics.${i}.blurb`)} label="Short description" max={120} />
          </div>
          <FaqListEditor control={control} name={`topics.${i}.items` as 'topics.0.items'} />
        </section>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_FAQ_TOPICS}
        onClick={() => append({ name: '', blurb: '', items: [{ question: '', answer: '' }] })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add topic
      </Button>
    </div>
  )
}
