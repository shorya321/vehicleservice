export const dynamic = 'force-dynamic'

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { VendorApplicationForm } from "@/components/vendor-application/vendor-application-form"
import { PublicLayout } from "@/components/layout/public-layout"

export const metadata: Metadata = {
  title: "Become a Vendor | Start Your Transfer Business",
  description: "Apply to list your vehicles and start your rental business with us",
}

const benefits = [
  {
    number: "01",
    title: "No upfront fees",
    description: "Commission on completed bookings only. Zero cost to join the platform.",
  },
  {
    number: "02",
    title: "48-hour review",
    description: "Every application is reviewed by our team within two business days.",
  },
  {
    number: "03",
    title: "Weekly payouts",
    description: "Earnings deposited directly to your bank account each week.",
  },
]

const requirements = [
  "Business registration number",
  "Current trade license",
  "Valid insurance policy",
  "Banking details (optional initially)",
]

export default async function BecomeVendorPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/become-vendor")
  }

  // Check user role - only customers can access this page
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, phone")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "customer") {
    redirect("/unauthorized")
  }

  // Check if user already has an application
  const { data: existingApplication } = await supabase
    .from("vendor_applications")
    .select("status")
    .eq("user_id", user.id)
    .single()

  if (existingApplication) {
    redirect("/vendor-application")
  }

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)] min-h-screen">
        <div className="luxury-container py-8 md:py-12 lg:py-16">
          {/* Back Link */}
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] transition-colors mb-8 lg:mb-12 py-3 -my-3 motion-safe:animate-in fade-in-0 duration-300"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Account
          </Link>

          {/* Two-column grid on desktop, single column on mobile/tablet */}
          <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16 xl:gap-20">

            {/* Left Column — Persuasion (sticky on desktop) */}
            <div className="lg:sticky lg:top-28 lg:self-start mb-10 lg:mb-0 motion-safe:animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <h1 className="editorial-section-title--promoted [text-wrap:balance] mb-4">
                Partner with Infinia
              </h1>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-10 max-w-md">
                List your vehicles on our premium transfer platform and grow your business with access to high-value bookings.
              </p>

              {/* Benefits — typographic, no card wrappers */}
              <div className="space-y-6 mb-10">
                {benefits.map((benefit) => (
                  <div key={benefit.number} className="flex gap-4">
                    <span className="text-lg font-semibold text-[var(--gold-text)] tabular-nums leading-6 shrink-0">
                      {benefit.number}
                    </span>
                    <div>
                      <p className="text-[var(--text-primary)] font-semibold leading-6">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-0.5">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Requirements checklist */}
              <div className="border-t border-[rgba(var(--gold-text-rgb),0.2)] pt-8">
                <p className="t-label-accent mb-3">
                  What you&apos;ll need
                </p>
                <ul className="space-y-2.5">
                  {requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[var(--gold-text)] shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-sm text-[var(--text-secondary)]">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column — Application Form */}
            <div className="motion-safe:animate-in fade-in-0 slide-in-from-bottom-4 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
              <div className="bg-[var(--black-rich)] border border-[rgba(var(--gold-text-rgb),0.2)] rounded-lg p-6 md:p-8">
                <div className="mb-8">
                  <p className="t-label-accent mb-2">
                    Application
                  </p>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] [text-wrap:balance]">
                    Vendor Registration
                  </h2>
                </div>

                <VendorApplicationForm
                  userId={user.id}
                  defaultValues={{
                    businessEmail: profile?.email || "",
                    businessPhone: profile?.phone || "",
                  }}
                />
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-[var(--text-muted)] mt-6">
                By submitting, you agree to our{" "}
                <Link href="/terms" className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/vendor-agreement" className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] transition-colors">
                  Vendor Agreement
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
