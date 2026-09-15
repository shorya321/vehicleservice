import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Headset, ReceiptText, RotateCcw, UserRound } from "lucide-react"
import { SavedRoute } from "./saved-route"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

const MEMBER_FACTS = [
  {
    Icon: UserRound,
    title: "Details on file",
    detail: "Return bookings in seconds, passenger details already filled in.",
  },
  {
    Icon: RotateCcw,
    title: "Rebook in two taps",
    detail: "Any past route, same vehicle class.",
  },
  {
    Icon: ReceiptText,
    title: "Every trip on record",
    detail: "City, route, date, vehicle and receipt.",
  },
  {
    Icon: Headset,
    title: "Priority support",
    detail: "No queue, by phone or by email.",
  },
] as const

/**
 * Markup only, so it renders under test. The reveal lives in
 * ./join-community.tsx. Layout follows the Arrivals Cascade account section
 * (copy and a checklist left, a picture right; here a saved route on the city map), drawn in
 * the home page's own vocabulary: the ruled eyebrow, editorial list type, the
 * gold .btn-primary and the --stub-* card ground. See `.account-plate` in
 * app/globals.css.
 */
export function JoinCommunityPlate(): React.JSX.Element {
  return (
    <div className="account-plate">
      <div>
        <div className="editorial-eyebrow account-plate__eyebrow">Your account</div>
        <h2 id="membership-heading" className="editorial-section-title mt-5">
          One signup. Every ride faster after that.
        </h2>
        <p className="account-plate__body mt-[1.125rem]">
          A free account is part of every first booking. From then on your routes,
          passenger details and receipts stay in one place.
        </p>
        <ul className="account-plate__checks">
          {MEMBER_FACTS.map(({ Icon, title, detail }) => (
            <li key={title}>
              <Icon className="account-plate__icon" aria-hidden="true" />
              <div>
                <b className="editorial-list-title">{title}</b>
                <span className="editorial-list-body">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="account-plate__actions">
          <Link href="/register" className="btn btn-primary">
            Create a free account
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/login" className="account-plate__quiet">
            Sign in
          </Link>
        </div>
      </div>
      <SavedRoute />
    </div>
  )
}
