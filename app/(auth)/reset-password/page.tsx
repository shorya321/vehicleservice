"use client"

import { Suspense } from "react"
import { motion } from "motion/react"
import { Loader2, HelpCircle } from "lucide-react"
import Link from "next/link"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"

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
          {/* Page Header */}
          <motion.header
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] font-light text-[var(--text-primary)] mb-4">
              Set New <span className="gold-text">Password</span>
            </h1>
            <p className="text-base text-[var(--text-secondary)]">
              Create a strong password for your account
            </p>
            <div className="section-divider mt-6">
              <span className="section-divider-icon" />
            </div>
          </motion.header>

          {/* Reset Password Card */}
          <ResetPasswordCard />

          {/* Help Section */}
          <motion.div
            className="mt-8 p-4 bg-[rgba(42,40,38,0.3)] border border-[rgba(198,170,136,0.1)] rounded-xl flex items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-9 h-9 flex items-center justify-center bg-[rgba(198,170,136,0.1)] rounded-full flex-shrink-0">
              <HelpCircle className="w-[18px] h-[18px] stroke-[var(--gold)]" />
            </div>
            <div>
              <p className="text-[0.8125rem] text-[var(--text-muted)] mb-0.5">
                Need assistance with your account?
              </p>
              <Link
                href="/contact"
                className="text-[0.8125rem] text-[var(--gold)] font-medium hover:text-[var(--gold-light)] transition-colors"
              >
                Contact Support &rarr;
              </Link>
            </div>
          </motion.div>
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
