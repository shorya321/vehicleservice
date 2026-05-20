import { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
}

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

function VerifyLayout({
  icon,
  iconClass,
  eyebrow,
  headline,
  body,
  cta,
}: {
  icon: React.ReactNode
  iconClass: string
  eyebrow: string
  headline: string
  body: string
  cta: { label: string; href: string }
}) {
  return (
    <main className="auth-verify-page flex min-h-screen items-center justify-center bg-[var(--black-void)] px-6">
      <div className="w-full max-w-[480px] text-center">
        <div
          className={`mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}
        >
          {icon}
        </div>

        <div className="editorial-eyebrow">{eyebrow}</div>

        <h1 className="mt-5 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)]">
          {headline}
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
          {body}
        </p>

        <Link
          href={cta.href}
          className="btn btn-primary mt-10 inline-flex h-[52px] items-center justify-center rounded-[4px] px-8"
        >
          {cta.label}
        </Link>
      </div>
    </main>
  )
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams
  const { token } = params

  if (!token) {
    return (
      <VerifyLayout
        icon={<XCircle className="h-8 w-8" aria-hidden="true" />}
        iconClass="bg-[rgba(var(--destructive-rgb),0.1)] text-[rgba(var(--destructive-rgb),1)]"
        eyebrow="Verification"
        headline="Invalid link."
        body="The verification link is invalid or missing. Request a new one from sign-in."
        cta={{ label: "Go to sign in", href: "/login" }}
      />
    )
  }

  const supabase = await createAdminClient()

  const { data: result, error } = await supabase.rpc(
    "verify_email_with_token",
    { p_token: token }
  )

  if (error || !result?.success) {
    return (
      <VerifyLayout
        icon={<XCircle className="h-8 w-8" aria-hidden="true" />}
        iconClass="bg-[rgba(var(--destructive-rgb),0.1)] text-[rgba(var(--destructive-rgb),1)]"
        eyebrow="Verification"
        headline="Verification failed."
        body={
          result?.error ||
          "The verification link is invalid or has expired. Please contact support if you need assistance."
        }
        cta={{ label: "Go to sign in", href: "/login" }}
      />
    )
  }

  return (
    <VerifyLayout
      icon={<CheckCircle2 className="h-8 w-8" aria-hidden="true" />}
      iconClass="bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold)]"
      eyebrow="Verified"
      headline="Email confirmed."
      body="Your email address has been verified. You can now sign in to your account with full access."
      cta={{ label: "Continue to sign in", href: "/login" }}
    />
  )
}
