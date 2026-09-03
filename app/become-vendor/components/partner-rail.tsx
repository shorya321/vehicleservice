/**
 * The two static blocks in the persuasion rail.
 *
 * Both take a wrapper class because the order differs by breakpoint. On desktop the
 * rail reads pitch, figures, requirements, index. On a phone the requirements come
 * first, since they are the pre-flight check for a 17-field form, and the figures move
 * below it: by then the applicant has already clicked through from their account, and
 * the one figure that matters at the moment of commitment is on the docked bar.
 */

/**
 * The three facts, on `.editorial-list`.
 *
 * The index column carries the figure rather than an ordinal. DESIGN.md's
 * Numerals-Are-Display Rule: any number someone reads to make a decision gets tabular
 * figures and a weight bump. These three benefits are also not a sequence, so the
 * ordinals they used to carry claimed an order that was not there. They moved to the
 * section index, where the order is real.
 */
const BENEFITS: ReadonlyArray<{ figure: string; title: string; body: string }> = [
  {
    figure: "0%",
    title: "No upfront fees",
    body: "Commission on completed bookings only. Nothing to join.",
  },
  {
    figure: "48h",
    title: "Application review",
    body: "Every application is read by our team within two business days.",
  },
  {
    figure: "7d",
    title: "Payout cycle",
    body: "Earnings go to your bank account every week.",
  },
]

/**
 * What to have to hand, as hairline rows.
 *
 * This was five gold tick icons. `.account-dl` is the system's trust idiom and its own
 * source says why: "hairline rows, no badges and no icons: trust here is the absence
 * of a badge."
 */
const REQUIREMENTS: ReadonlyArray<{ label: string; body: string }> = [
  { label: "Business contact", body: "Email, phone and a registered address." },
  { label: "Registration number", body: "Issued by your licensing authority." },
  { label: "Trade licence", body: "Current, with its expiry date." },
  { label: "Insurance policy", body: "Valid, with its expiry date." },
  { label: "Bank details", body: "Skippable now. Add them later from your dashboard." },
]

export function PartnerBenefits({ className = "" }: { className?: string }) {
  return (
    <ul className={`editorial-list ${className}`}>
      {BENEFITS.map((benefit) => (
        <li key={benefit.figure} className="grid-cols-[3.5rem_1fr]">
          <span className="editorial-list-index">{benefit.figure}</span>
          <div>
            <p className="editorial-list-title">{benefit.title}</p>
            <p className="editorial-list-body">{benefit.body}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PartnerRequirements({ className = "" }: { className?: string }) {
  return (
    <section className={className} aria-labelledby="vendor-requirements-heading">
      <h2 id="vendor-requirements-heading" className="editorial-eyebrow">
        What you&apos;ll need
      </h2>
      <dl className="account-dl account-dl-stacked mt-4">
        {REQUIREMENTS.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
