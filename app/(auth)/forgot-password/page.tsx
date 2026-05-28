import { Metadata } from "next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"
import { AuthLogo } from "@/components/auth/auth-logo"

const AuthHeroPanel = dynamic(
  () => import("@/components/auth/auth-hero-panel").then(m => ({ default: m.AuthHeroPanel })),
  { ssr: true }
)

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Infinia Transfers account password.",
}

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <AuthHeroPanel />

      <section className="auth-panel">
        <div className="auth-container">
          <div className="lg:hidden text-center mb-8">
            <AuthLogo />
          </div>

          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
              </div>
            }
          >
            <ForgotPasswordCard />
          </Suspense>

          <p className="mt-6 text-center auth-body-sm text-[var(--text-muted)]">
            Need help?{" "}
            <Link
              href="/contact"
              className="auth-text-link"
            >
              Contact support
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
