import * as React from "react"
import { ArrowUpRight, Headset, ReceiptText, RotateCcw, UserRound } from "lucide-react"
import { SavedRoute } from "./saved-route"
import { CmsLink } from "@/components/cms/cms-link"
import type { HomeContent } from "@/lib/cms/templates/home/schema"

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/** One icon per checklist slot. The copy is editable; the icons stay with the layout. */
const FACT_ICONS = [UserRound, RotateCcw, ReceiptText, Headset] as const

interface JoinCommunityPlateProps {
  content: HomeContent["account"]
}

/**
 * Markup only, so it renders under test. The reveal lives in
 * ./join-community.tsx. Layout follows the Arrivals Cascade account section
 * (copy and a checklist left, a picture right; here a saved route on the city map), drawn in
 * the home page's own vocabulary: the ruled eyebrow, editorial list type, the
 * gold .btn-primary and the --stub-* card ground. See `.account-plate` in
 * app/globals.css.
 */
export function JoinCommunityPlate({ content }: JoinCommunityPlateProps): React.JSX.Element {
  return (
    <div className="account-plate">
      <div>
        <div className="editorial-eyebrow editorial-eyebrow--pill account-plate__eyebrow">
          <i aria-hidden="true" />
          {content.eyebrow}
        </div>
        <h2 id="membership-heading" className="editorial-section-title mt-5">
          {content.title}
        </h2>
        {content.body && <p className="account-plate__body mt-[1.125rem]">{content.body}</p>}
        <ul className="account-plate__checks">
          {content.facts.map(({ title, detail }, index) => {
            const Icon = FACT_ICONS[index % FACT_ICONS.length]
            return (
              <li key={index}>
                <Icon className="account-plate__icon" aria-hidden="true" />
                <div>
                  <b className="editorial-list-title">{title}</b>
                  <span className="editorial-list-body">{detail}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="account-plate__actions">
          <CmsLink href={content.primary_cta.href} className="btn btn-primary">
            {content.primary_cta.label}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </CmsLink>
          <CmsLink href={content.secondary_cta.href} className="account-plate__quiet tap-target">
            {content.secondary_cta.label}
          </CmsLink>
        </div>
      </div>
      <SavedRoute />
    </div>
  )
}
