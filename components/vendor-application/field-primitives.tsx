/**
 * One field treatment for the vendor application, hoisted so it cannot drift between
 * the three sections.
 *
 * The old inline string stacked shadcn's `focus-visible:ring-2 ring-primary
 * border-primary` against the form's own `focus:ring-1 ring-[gold-text]/20
 * border-[gold-text]`. Two different variants, so tailwind-merge could not reconcile
 * them and the resolved ring width and border colour came down to stylesheet order.
 * Worse, `Input` carries `focus-visible:outline-none`, which cancels the 2px gold
 * outline the rest of the app relies on. This is one focus state, on one variant,
 * built to the spec in DESIGN.md section 5: the border goes to Vellum Gold and a 4px
 * ring at 15% blooms outside it.
 */
export const FIELD_BASE = [
  "bg-[var(--black-warm)] border-[var(--graphite)] rounded-[4px]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "hover:border-[rgba(var(--gold-rgb),0.3)]",
  "focus-visible:outline-none focus-visible:border-[var(--gold)]",
  "focus-visible:ring-4 focus-visible:ring-[rgba(var(--gold-rgb),0.15)]",
  "transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
].join(" ")

export const FIELD_INPUT = `h-[52px] ${FIELD_BASE}`

/**
 * Uppercase micro-caps, as on checkout. Sentence-case labels sitting under an
 * uppercase section eyebrow was the exact tension `.checkout-field-label`'s own
 * comment records as settled elsewhere.
 */
export const FIELD_LABEL = "checkout-field-label mb-2.5 block"

/** Helper text. One size, so the gap between fields stops alternating. */
export const FIELD_HELP = "text-xs text-[var(--text-muted)] mt-2"

/**
 * Optional is marked; required is the default. Twelve of seventeen fields carried a
 * bare asterisk, which is noise on the majority and tells you nothing about the five
 * that can actually be skipped.
 */
export function OptionalTag() {
  return <span className="checkout-field-optional">Optional</span>
}
