/**
 * The guarantees the customer was shown at confirmation, repeated where they
 * come back to check them. Hairline rows, no badges and no icons: as the
 * confirmation page puts it, trust here is the absence of a badge.
 */
const GUARANTEES: ReadonlyArray<{ label: string; body: string }> = [
  {
    label: "The price is the price",
    body: "What you see is what you paid. Vehicle, chauffeur, fuel, tolls and parking are all in it. No surge, no tip prompt.",
  },
  {
    label: "Cancel free up to 24 hours before",
    body: "Cancel any confirmed transfer up to 24 hours before pickup and the full amount goes back to your card.",
  },
  {
    label: "Someone answers, at any hour",
    body: "Reply to any booking email, or reach the desk from the contact page. A person reads it.",
  },
]

export function AccountTrustRail() {
  return (
    <section
      className="mt-[clamp(2.5rem,6vw,4rem)] border-t border-[var(--border-subtle)] pt-[clamp(2rem,4vw,3rem)]"
      aria-labelledby="account-trust-heading"
    >
      <h2 id="account-trust-heading" className="account-label">
        Every transfer, as standard
      </h2>
      <dl className="account-dl account-dl-stacked mt-4">
        {GUARANTEES.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
