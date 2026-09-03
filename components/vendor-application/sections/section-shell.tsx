import type { ReactNode } from "react"

interface SectionShellProps {
  /** Anchors the left rail's index. Kept off the fieldset's own semantics. */
  id: string
  title: string
  /** One sentence. Leads with what the applicant needs to decide, not with our process. */
  note: ReactNode
  children: ReactNode
}

/**
 * A form section on the checkout rail.
 *
 * `.checkout-form-section` is flat by design and its `+` sibling rule supplies the
 * 2.5rem gap and the gold hairline, so the three hand-placed `border-t` divider divs
 * this form used to carry are gone. `.checkout-section-title` brings the 28px gold
 * rule that every other eyebrow in the product has and this page did not.
 */
export function SectionShell({ id, title, note, children }: SectionShellProps) {
  return (
    <fieldset id={id} className="checkout-form-section border-0 p-0 m-0 scroll-mt-32">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6">
        <p className="checkout-section-title" aria-hidden="true">
          {title}
        </p>
        <p className="mt-2.5 text-sm text-[var(--text-muted)] max-w-[52ch]">{note}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </fieldset>
  )
}
