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
    <main className="min-h-screen bg-[var(--black-void)] lg:grid lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
      <AuthHeroPanel />

      <section className="flex min-h-screen items-center justify-center px-6 py-16 lg:min-h-0 lg:py-24">
        <div className="w-full max-w-[460px]">
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
