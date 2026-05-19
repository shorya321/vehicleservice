"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"
import { AuthLogo } from "@/components/auth/auth-logo"

/**
 * Reset Password Page
 *
 * Luxury-themed password reset page following the Infinia design system.
 * Uses the same two-column layout as the login page for visual consistency.
 * Features:
 * - Hero panel on the left (desktop only)
 * - Password reset form on the right
 * - Session validation (redirects if no valid session)
 * - Help/support section at the bottom
 */
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

          {/* Help link */}
          <p className="mt-8 text-center text-[0.8125rem] text-[var(--text-muted)]">
            Need assistance?{" "}
            <Link
              href="/contact"
              className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] font-medium transition-colors"
            >
              Contact support
            </Link>
          </p>
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
