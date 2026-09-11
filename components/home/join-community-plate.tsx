import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

const MEMBER_FACTS = [
  "Return bookings in seconds, your details already on file.",
  "Rebook a past route in two taps, same vehicle class.",
  "Every trip on record: city, route, date, vehicle, receipt.",
  "Priority support with no queue, by phone or by email.",
] as const

/**
 * Markup only, so it renders under test. The reveal lives in
 * ./join-community.tsx. The plate shares .promise-card's --stub-* ground;
 * see the `.account-plate` block in app/globals.css.
 */
export function JoinCommunityPlate(): React.JSX.Element {
  return (
    <div className="account-plate">
      <div>
        <div className="editorial-eyebrow account-plate__eyebrow">Your account</div>
        <h2
          id="membership-heading"
          className="editorial-section-title mt-5"
        >
          One signup. Every ride faster after that.
        </h2>
        <p className="account-plate__body mt-4">
          A free account is part of every first booking. From then on your routes,
          passenger details and receipts stay in one place.
        </p>
        <div className="account-plate__actions">
          <Link href="/register" className="btn btn-primary">
            Create a free account
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
      <ul className="account-plate__list">
        {MEMBER_FACTS.map((fact, idx) => (
          <li key={fact}>
            <span className="account-plate__index numeric">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
