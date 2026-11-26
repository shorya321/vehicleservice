// `import * as React` is for jest: ts-jest compiles JSX with the classic runtime.
import * as React from 'react'

/**
 * Body styling for CMS rich text in a numbered legal section. Gold dot bullets, bold lead-ins
 * in the primary text colour, and `<blockquote>` turned into a gold-ruled callout box (the
 * sanitiser allows it, so editors get the callout from the editor's quote button).
 * Utilities rather than a globals.css block: they outrank `.prose-luxury` without !important
 * and cannot collide with another page's class.
 */
const BODY_CLASS = [
  'prose-luxury max-w-none',
  '[&_ul]:list-none [&_ul]:pl-0',
  '[&_li]:relative [&_li]:pl-5 [&_li]:mb-2.5 [&_li]:leading-relaxed',
  "[&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em]",
  '[&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-[var(--gold)]',
  '[&_strong]:text-[var(--text-primary)] [&_strong]:font-medium',
  '[&_a]:text-[var(--gold-text)] [&_a]:underline [&_a]:underline-offset-2',
  '[&_blockquote]:my-6 [&_blockquote]:border-y-0 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--gold)]',
  '[&_blockquote]:bg-[rgba(var(--gold-rgb),0.05)] [&_blockquote]:px-6 [&_blockquote]:py-5',
  '[&_blockquote]:not-italic [&_blockquote]:text-[0.9375rem] [&_blockquote]:font-normal [&_blockquote]:text-[var(--text-secondary)]',
].join(' ')

interface NumberedLegalSectionProps {
  id: string
  index: number
  title: string
  /** Already sanitised HTML. */
  html: string
}

export function NumberedLegalSection({ id, index, title, html }: NumberedLegalSectionProps): React.JSX.Element {
  const number = String(index + 1).padStart(2, '0')

  return (
    <section id={id} className="scroll-mt-28 grid grid-cols-[3.5rem_1fr] gap-x-5 md:grid-cols-[4rem_1fr] md:gap-x-7">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center border-l-2 border-[var(--gold)] bg-[rgba(var(--gold-rgb),0.06)] text-[1.5rem] md:text-[1.75rem] font-light tabular-nums text-[var(--gold-text)]"
      >
        {number}
      </div>
      <h2 className="self-center md:self-start md:pt-3 text-[clamp(1.375rem,2.2vw,1.875rem)] font-normal leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h2>
      {/* Full width under the number on phones; beside it, under the heading, from md. */}
      <div
        className={`col-span-2 mt-5 min-w-0 md:col-span-1 md:col-start-2 md:-mt-0 ${BODY_CLASS}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

    </section>
  )
}
