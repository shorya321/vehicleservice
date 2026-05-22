import { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { AuthHeroStatic } from "@/components/auth/auth-hero-static"
import { AuthLogo } from "@/components/auth/auth-logo"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
}

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams
  const { token } = params

  if (!token) {
    return (
      <main className="auth-page">
        <AuthHeroStatic />
        <section className="auth-panel">
          <div className="auth-container">
            <div className="lg:hidden text-center mb-8">
              <AuthLogo className="text-2xl" />
            </div>
            <XCircle className="h-12 w-12 text-[hsl(var(--destructive))]" />
            <div className="editorial-eyebrow mt-6">Invalid Link</div>
            <h1 className="editorial-headline mt-6">
              Invalid <em>link.</em>
            </h1>
            <p className="editorial-body mt-6 max-w-md">
              The verification link is invalid or missing. Request a new one from your account settings.
            </p>
            <Link
              href="/login"
              className="btn btn-primary mt-10 inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
            >
              Go to login
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const supabase = await createAdminClient()

  const { data: result, error } = await supabase
    .rpc('verify_email_with_token', { p_token: token })

  if (error || !(result as Record<string, unknown>)?.success) {
    return (
      <main className="auth-page">
        <AuthHeroStatic />
        <section className="auth-panel">
          <div className="auth-container">
            <div className="lg:hidden text-center mb-8">
              <AuthLogo className="text-2xl" />
            </div>
            <XCircle className="h-12 w-12 text-[hsl(var(--destructive))]" />
            <div className="editorial-eyebrow mt-6">Verification Failed</div>
            <h1 className="editorial-headline mt-6">
              Verification <em>failed.</em>
            </h1>
            <p className="editorial-body mt-6 max-w-md">
              {(result as Record<string, unknown>)?.error as string || "The verification link is invalid or has expired."}
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="/login"
                className="btn btn-primary inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
              >
                Go to login
              </Link>
              <Link
                href="/contact"
                className="btn btn-secondary inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
              >
                Contact support
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <AuthHeroStatic />
      <section className="auth-panel">
        <div className="auth-container">
          <div className="mb-10 lg:hidden">
            <AuthLogo className="text-2xl" />
          </div>
          <CheckCircle2 className="h-12 w-12 text-[var(--gold)]" />
          <div className="editorial-eyebrow mt-6">Verified</div>
          <h1 className="editorial-headline mt-6">
            Email <em>confirmed.</em>
          </h1>
          <p className="editorial-body mt-6 max-w-md">
            Your email address has been verified. You can now log in with full access.
          </p>
          <Link
            href="/login"
            className="btn btn-primary mt-10 inline-flex h-[52px] items-center justify-center rounded-[4px] px-7"
          >
            Continue to login
          </Link>
        </div>
      </section>
    </main>
  )
}
