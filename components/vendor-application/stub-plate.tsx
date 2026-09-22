/**
 * The checkout stub, as the status page draws it.
 *
 * The plate itself is `.checkout-summary-card` and the cap is `.checkout-stub-cap`, both from
 * globals.css, the same pair become-vendor's form and after-submit card sit on. These are the
 * two pieces the page needs around them: the tear, and a body band aligned to the cap's 1.5rem
 * inset. The cap's padding is unlayered CSS, so a Tailwind `xl:px-8` could not widen it; the
 * body stays at `px-6` at every width so the two edges agree.
 */
export const STUB_PLATE = 'checkout-summary-card'
export const STUB_BODY = 'px-6 pb-6 pt-2'

/** The perforation. Notches are filled with the page ground by `.checkout-stub-perf span`. */
export function StubPerf(): React.JSX.Element {
  return (
    <div className="checkout-stub-perf" aria-hidden="true">
      <span />
      <span />
    </div>
  )
}
