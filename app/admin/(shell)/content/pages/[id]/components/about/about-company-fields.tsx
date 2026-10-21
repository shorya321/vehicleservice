'use client'

import { TextField } from '@/components/admin/cms/text-field'
import { SectionHead } from './about-section-fields'
import { p, type AboutControl } from './fields'

/**
 * Legal facts for "The company behind the desk". Phone, email and office come
 * from Settings > General so the footer and this section never disagree.
 */
export function AboutCompanyFields({ control }: { control: AboutControl }) {
  return (
    <div className="space-y-4">
      <SectionHead control={control} section="company" />
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Phone, email and office address are read from Settings &gt; General. Any field left empty here is hidden on the page.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={control} name={p('company.legalName')} label="Legal name" max={80} placeholder="Infinia Transfers L.L.C" />
        <TextField control={control} name={p('company.founded')} label="Founded (year)" max={10} placeholder="2024" />
        <TextField control={control} name={p('company.licence')} label="Trade licence number" max={80} />
        <TextField control={control} name={p('company.licenceIssuer')} label="Licence issued by" max={80} placeholder="Dubai DET" />
      </div>
      <TextField
        control={control}
        name={p('company.deskHours')}
        label="Desk hours"
        max={80}
        description="Must match the homepage FAQ and the Terms."
      />
      <TextField control={control} name={p('company.payments')} label="Payments" max={120} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <TextField control={control} name={p('company.zonesNote')} label="Line under the cards" max={120} />
        <TextField control={control} name={p('company.zonesLink.label')} label="Link text" max={40} />
        <TextField control={control} name={p('company.zonesLink.href')} label="Link" max={300} placeholder="/routes" />
      </div>
    </div>
  )
}
