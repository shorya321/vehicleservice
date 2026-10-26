import Link from "next/link"
import { FORM_COPY, type CustomerAuthScreen } from "./customer-auth-content"

interface CustomerAuthIntroProps {
  screen: CustomerAuthScreen
  /** Lets a paragraph double as a field description (reset uses it). */
  bodyId?: string
}

export function CustomerAuthIntro({ screen, bodyId }: CustomerAuthIntroProps): React.JSX.Element {
  const copy = FORM_COPY[screen]

  return (
    <>
      <p className="cauth-eyebrow">
        {copy.eyebrow}
        {copy.eyebrowAccent && <span> · {copy.eyebrowAccent}</span>}
      </p>
      <h1 className="cauth-title">{copy.title}</h1>
      <p id={bodyId} className="cauth-summary">{copy.body}</p>
    </>
  )
}

interface CustomerAuthTrustProps {
  screen: CustomerAuthScreen
}

export function CustomerAuthTrust({ screen }: CustomerAuthTrustProps): React.JSX.Element {
  const items = FORM_COPY[screen].trust

  if (items.length === 0) {
    return (
      <p className="cauth-help">
        Need help? <Link href="/contact" className="cauth-link">Contact support</Link>
      </p>
    )
  }

  return (
    <ul className="cauth-trust">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}
