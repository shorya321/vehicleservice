export const dynamic = 'force-dynamic'

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { VendorApplicationForm } from "@/components/vendor-application/vendor-application-form"
import { PublicLayout } from "@/components/layout/public-layout"
import { ApplicationIndex } from "./components/application-index"
import { PartnerBenefits, PartnerRequirements } from "./components/partner-rail"

export const metadata: Metadata = {
  title: "Become a Vendor | Start Your Transfer Business",
  description: "Apply to list your vehicles and start your rental business with us",
}

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

            {/* Left Column. Persuasion (sticky on desktop) */}
            <div className="lg:sticky lg:top-28 lg:self-start mb-10 lg:mb-0 motion-safe:animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* The site's eyebrow, with its 28px gold rule. This page used a bare
                  `t-label-accent` in five places and was the only one without it. */}
              <p className="editorial-eyebrow">Partner programme</p>

              {/* The CheckoutHeading recipe, as on the account page and confirmation.
                  This was `editorial-section-title--promoted`: a class documented for
                  mid-page sections, a full weight heavier and ~27% larger than every
                  other page title in the product. */}
              <h1 className="mt-[0.5rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
                Partner with <em className="not-italic font-normal text-[var(--gold-text)]">Infinia</em>
              </h1>

              {/* The account CTA's own words. The promise someone clicks and the
                  promise they land on should be the same one. */}
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-[34ch]">
                Run a fleet in the UAE? List your vehicles and take bookings through us.
              </p>

              <PartnerBenefits className="mt-8 max-lg:hidden" />
              <PartnerRequirements className="mt-8 lg:mt-9" />

              {/* Fills what was ~950px of empty column beside the form. Desktop only:
                  it tracks a rail that does not exist below `lg`. */}
              <ApplicationIndex />
            </div>

            {/* Right Column. Application Form.
                Fade only, no slide. Two large rectangles sliding up together was not an
                arrival, it was two rectangles moving. It also matters mechanically: a
                transform on this column would make it the containing block for the
                docked mobile action inside it, so the bar would sit against the column
                rather than the viewport for the length of the entrance. */}
            <div className="motion-safe:animate-in fade-in-0 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
              <div className="bg-[var(--black-rich)] border border-[rgba(var(--gold-text-rgb),0.2)] rounded-lg p-6 md:p-8">
                <div className="mb-8">
                  <p className="editorial-eyebrow">Application</p>
                  <h2 className="mt-2 t-subhead font-medium">
                    Vendor registration
                  </h2>
                </div>

                <VendorApplicationForm
                  defaultValues={{
                    businessEmail: profile?.email || "",
                    businessPhone: profile?.phone || "",
                  }}
                />
              </div>

              {/* Left-aligned with the column it belongs to. It was centered under an
                  entirely left-aligned rail. */}
              <p className="mt-6 text-xs text-[var(--text-muted)]">
                By submitting, you agree to our{" "}
                <Link href="/terms" className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/vendor-agreement" className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] transition-colors">
                  Vendor Agreement
                </Link>
              </p>

              {/* On a phone the figures sit here instead, so the requirements checklist
                  and the first field arrive sooner. */}
              <PartnerBenefits className="mt-10 lg:hidden" />

              {/* Clears the docked action, which is out of flow below lg. Last thing on
                  the page, so nothing after the card can end up underneath it either. */}
              <div aria-hidden="true" className="h-[152px] sm:h-[116px] lg:hidden" />
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
