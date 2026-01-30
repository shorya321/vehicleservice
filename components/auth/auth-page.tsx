"use client"

import { Suspense } from "react"
import { motion } from "motion/react"
import { Loader2 } from "lucide-react"
import { AuthHeroPanel } from "./auth-hero-panel"
import { AuthFormCard } from "./auth-form-card"
import { AuthBenefits } from "./auth-benefits"

interface AuthPageProps {
  initialTab: "login" | "register"
}

function AuthPageContent({ initialTab }: AuthPageProps) {
  return (
    <main className="auth-page">
      {/* Left Panel - Hero (Desktop Only) */}
      <AuthHeroPanel />

      {/* Right Panel - Auth Form */}
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
              {initialTab === "login" ? (
                <>Welcome <span className="gold-text">Back</span></>
              ) : (
                <>Create <span className="gold-text">Account</span></>
              )}
            </h1>
            <p className="text-base text-[var(--text-secondary)]">
              Sign in or create an account to continue
            </p>
            <div className="section-divider mt-6">
              <span className="section-divider-icon" />
            </div>
          </motion.header>

          {/* Auth Card */}
          <AuthFormCard initialTab={initialTab} />

          {/* Benefits Section */}
          <AuthBenefits />
        </div>
      </section>
    </main>
  )
}

export function AuthPage({ initialTab }: AuthPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--black-void)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
        </div>
      }
    >
      <AuthPageContent initialTab={initialTab} />
    </Suspense>
  )
}
