"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { AuthFormCard } from "./auth-form-card"
import { AuthLogo } from "./auth-logo"

const AuthHeroPanel = dynamic(
  () => import("./auth-hero-panel").then(m => ({ default: m.AuthHeroPanel })),
  { ssr: true }
)

interface AuthPageProps {
  initialTab: "login" | "register"
}

export function AuthPage({ initialTab }: AuthPageProps) {
  return (
    <main className="auth-page">
      <AuthHeroPanel />

      <section className="auth-panel">
        <div className="auth-container">
          <div className="lg:hidden text-center mb-8">
            <AuthLogo className="text-2xl" />
          </div>
          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
              </div>
            }
          >
            <AuthFormCard initialTab={initialTab} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
