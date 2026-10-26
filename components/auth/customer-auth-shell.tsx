import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AuthLogo } from "./auth-logo"
import { CustomerAuthPanel } from "./customer-auth-panel"
import type { CustomerAuthScreen } from "./customer-auth-content"

interface CustomerAuthShellProps {
  screen: CustomerAuthScreen
  children: React.ReactNode
}

/**
 * Split screen for the customer auth pages. No site header or footer: the
 * (auth) layout already pins the theme toggle top right, so the strip here
 * keeps clear of it.
 */
export function CustomerAuthShell({ screen, children }: CustomerAuthShellProps): React.JSX.Element {
  return (
    <main className="cauth-page">
      <CustomerAuthPanel screen={screen} />

      <section className="cauth-main">
        <div className="cauth-strip">
          <span className="cauth-strip-logo">
            <AuthLogo variant="horizontal" />
          </span>
          <Link href="/" className="cauth-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="cauth-ghost-label">Back to home</span>
          </Link>
        </div>

        <div className="cauth-form-wrap">
          <div className="cauth-col">{children}</div>
        </div>
      </section>
    </main>
  )
}
