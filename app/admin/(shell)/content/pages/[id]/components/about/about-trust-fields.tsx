'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { SectionHead } from './about-section-fields'
import { p, type AboutControl } from './fields'

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4 rounded-lg border bg-card p-4">
    <h4 className="text-sm font-semibold">{title}</h4>
    {children}
  </div>
)

export function AboutStoryFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="story" />
      <TextField control={control} name={p('story.paragraphs.0')} label="Paragraph 1" max={600} rows={4} />
      <TextField control={control} name={p('story.paragraphs.1')} label="Paragraph 2" max={600} rows={4} />
      <Card title="Founder or team photo">
        <p className="text-sm text-muted-foreground">Use a real photo of the founder or the team at the desk, never stock. Leave empty and the story shows as text only.</p>
        <ImageField control={control} name={p('story.image')} label="Photo" description="Landscape, about 1200 x 960." />
        <TextField control={control} name={p('story.imageAlt')} label="Photo description (for screen readers)" max={140} />
      </Card>
    </div>
  )
}

/** Card lists for the vetting (4) and partner (3) sections. */
function CardList({ control, section, count }: { control: AboutControl; section: 'vetting' | 'partner'; count: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} title={`Card ${i + 1}`}>
          <TextField control={control} name={p(`${section}.items.${i}.title`)} label="Title (H3)" max={60} />
          <TextField control={control} name={p(`${section}.items.${i}.body`)} label="Text" max={220} rows={3} />
        </Card>
      ))}
    </div>
  )
}

export function AboutVettingFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="vetting" />
      <p className="text-sm text-muted-foreground">Only claim checks that are really done. Icons follow card order: licence, insurance, vehicle, removal.</p>
      <CardList control={control} section="vetting" count={4} />
      <TextField control={control} name={p('vetting.footnote')} label="Line under the cards" max={200} rows={2} />
    </div>
  )
}

export function AboutPartnerFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="partner" />
      <CardList control={control} section="partner" count={3} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Main button">
          <TextField control={control} name={p('partner.primary.label')} label="Text" max={40} />
          <TextField control={control} name={p('partner.primary.href')} label="Link" max={300} placeholder="/become-vendor" />
        </Card>
        <Card title="Second button">
          <TextField control={control} name={p('partner.secondary.label')} label="Text" max={40} />
          <TextField control={control} name={p('partner.secondary.href')} label="Link" max={300} placeholder="/contact" />
        </Card>
      </div>
      <TextField control={control} name={p('partner.footnote')} label="Line beside the buttons" max={200} rows={2} />
    </div>
  )
}

export function AboutFaqFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="faq" />
      <FaqListEditor control={control} name="faq.items" />
    </div>
  )
}
