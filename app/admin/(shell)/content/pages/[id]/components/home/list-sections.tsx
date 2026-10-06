'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { CtaFields, ItemCard, SectionHeaderFields, path, type HomeControl } from './fields'

interface SectionProps {
  control: HomeControl
}

export function AfterYouBookSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="after_you_book" />
      <CtaFields control={control} name="after_you_book.primary_cta" label="Main button" />
      <CtaFields control={control} name="after_you_book.secondary_cta" label="Second link" />
    </div>
  )
}

/** Sections whose cards come from the database; only the heading is copy. */
export function HeaderOnlySection({ control, section, note }: SectionProps & { section: string; note: string }) {
  return (
    <div className="space-y-6">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{note}</p>
      <SectionHeaderFields control={control} section={section} />
    </div>
  )
}

export function CitiesSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="cities" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <ItemCard key={i} title={`Card ${i + 1}`}>
            <TextField control={control} name={path(`cities.items.${i}.name`)} label="Name (H3)" max={40} />
            <TextField
              control={control}
              name={path(`cities.items.${i}.meta`)}
              label="Small line"
              max={30}
              description="e.g. 12 routes. Leave empty to hide."
            />
            <ImageField control={control} name={path(`cities.items.${i}.image`)} label="Photo" description="Portrait, about 640 x 860." />
            <TextField
              control={control}
              name={path(`cities.items.${i}.alt`)}
              label="Photo description (alt text)"
              max={160}
              description="Describe what the photo shows, for screen readers and image search."
            />
          </ItemCard>
        ))}
      </div>
    </div>
  )
}

export function BenefitsSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="benefits" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <ItemCard key={i} title={`Promise 0${i + 1}`}>
            <TextField control={control} name={path(`benefits.items.${i}.title`)} label="Title (H3)" max={60} />
            <TextField control={control} name={path(`benefits.items.${i}.body`)} label="Text" max={260} rows={4} />
            <TextField control={control} name={path(`benefits.items.${i}.meta`)} label="Footnote" max={40} />
          </ItemCard>
        ))}
      </div>
    </div>
  )
}

const ONBOARD_SLOTS = ['Wide photo tile', 'Tall photo tile', 'Small tile', 'Small tile']

export function OnboardSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="onboard" />
      <div className="grid gap-4 lg:grid-cols-2">
        {ONBOARD_SLOTS.map((slot, i) => (
          <ItemCard key={i} title={`${i + 1}. ${slot}`}>
            <TextField control={control} name={path(`onboard.items.${i}.title`)} label="Title (H3)" max={50} />
            <TextField control={control} name={path(`onboard.items.${i}.body`)} label="Text" max={220} rows={3} />
            <TextField control={control} name={path(`onboard.items.${i}.meta`)} label="Footnote" max={40} />
            {i < 2 && (
              <>
                <ImageField
                  control={control}
                  name={path(`onboard.items.${i}.image`)}
                  label="Photo"
                  description="Remove the photo to show this tile as text only."
                />
                <TextField control={control} name={path(`onboard.items.${i}.alt`)} label="Photo description (alt text)" max={160} />
              </>
            )}
          </ItemCard>
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        The quote and rating come from approved reviews. Feature a review under Reviews to choose the quote.
      </p>
      <SectionHeaderFields control={control} section="testimonials" />
      <CtaFields control={control} name="testimonials.cta" label="Button" />
    </div>
  )
}

export function AccountSection({ control }: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="account" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <ItemCard key={i} title={`Checklist row ${i + 1}`}>
            <TextField control={control} name={path(`account.facts.${i}.title`)} label="Title" max={40} />
            <TextField control={control} name={path(`account.facts.${i}.detail`)} label="Detail" max={120} />
          </ItemCard>
        ))}
      </div>
      <CtaFields control={control} name="account.primary_cta" label="Main button" />
      <CtaFields control={control} name="account.secondary_cta" label="Second link" />
    </div>
  )
}
