import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { AuthHeroPanelStatic } from "@/components/auth/auth-hero-panel-static"
import { AuthLogo } from "@/components/auth/auth-logo"

export default function UnauthorizedPage() {
  return (
    <main className="auth-page">
      <AuthHeroPanelStatic />
      <section className="auth-panel">
        <div className="auth-container">
          <div className="lg:hidden text-center mb-8">
            <AuthLogo className="text-2xl" />
          </div>
          <ShieldAlert className="h-12 w-12 text-destructive" aria-hidden="true" />
          <div className="editorial-eyebrow mt-6">Access Denied</div>
          <h1 className="editorial-headline mt-6">
            Not <em>authorized.</em>
          </h1>
          <p className="editorial-body mt-6 max-w-md">
            You don&apos;t have permission to view this page. Try signing in with a different account.
          </p>
          <div className="mt-10 flex gap-4">
            <Link
              href="/"
              className="btn btn-secondary inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
            >
              Go to home
            </Link>
            <Link
              href="/login"
              className="btn btn-primary inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
