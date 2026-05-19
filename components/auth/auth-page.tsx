"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { AuthHeroPanel } from "./auth-hero-panel"
import { AuthFormCard } from "./auth-form-card"
import { AuthLogo } from "./auth-logo"

interface AuthPageProps {
  initialTab: "login" | "register"
}

function AuthPageContent({ initialTab }: AuthPageProps) {
  return (
    <main className="auth-page min-h-screen bg-[var(--black-void)]">
      <AuthHeroPanel />

      <section className="auth-panel">
        <div className="auth-container">
          <div className="mb-10 lg:hidden">
            <AuthLogo className="text-2xl" />
          </div>
          <AuthFormCard initialTab={initialTab} />
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
