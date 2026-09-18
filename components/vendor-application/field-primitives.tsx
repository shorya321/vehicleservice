/**
 * One field treatment for the vendor application, hoisted so it cannot drift between
 * the three sections.
 *
 * It is the checkout passenger field, class for class (components/checkout/
 * form-sections/passenger-info-section.tsx): a --black-warm fill on a graphite border,
 * 52px tall, `Input`'s own 6px radius and 12px inset. Focus is `Input`'s default, a
 * gold border with a 2px gold ring, so a field looks and behaves the same whether it
 * is reached from checkout or from here. Hover comes from `.checkout-form-section`,
 * which both forms' sections carry.
 */
export const FIELD_BASE = [
  "bg-[var(--black-warm)] border-[var(--graphite)]",
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
  "focus:ring-1 focus:border-[var(--gold)]",
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
