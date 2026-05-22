"use client"

import { Suspense } from "react"
import { Loader2, HelpCircle } from "lucide-react"
import Link from "next/link"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"
import { AuthLogo } from "@/components/auth/auth-logo"

function ResetPasswordContent() {
  return (
    <main className="auth-page">
      {/* Left Panel - Hero (Desktop Only) */}
      <AuthHeroPanel />

      {/* Right Panel - Reset Password Form */}
      <section className="auth-panel">
        <div className="auth-container w-full max-w-[480px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <AuthLogo />
          </div>

          {/* Reset Password Card */}
          <ResetPasswordCard />

          {/* Help Section */}
          <div className="mt-8 flex items-center gap-4 rounded-[8px] border border-[var(--graphite)] bg-[var(--charcoal)] p-4">
            <HelpCircle className="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" />
            <div>
              <p className="text-[0.8125rem] text-[var(--text-muted)] mb-0.5">
                Need help with your account?
              </p>
              <Link
                href="/contact"
                className="text-[0.8125rem] text-[var(--gold)] font-medium hover:text-[var(--gold-pale)] transition-colors"
              >
                Contact Support &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--black-void)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
