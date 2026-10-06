'use client'

import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { CtaFields, SectionHeaderFields, type HomeControl } from './fields'

export function FaqSection({ control }: { control: HomeControl }) {
  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="faq" />
      <CtaFields control={control} name="faq.cta" label="Button" />
      <FaqListEditor control={control} name="faq.items" />
    </div>
  )
}
