export const dynamic = 'force-dynamic'

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Building2, FileText, CreditCard, Info } from "lucide-react"
import Link from "next/link"
import { VendorApplicationForm } from "@/components/vendor-application/vendor-application-form"
import { PublicLayout } from "@/components/layout/public-layout"

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

  // Check if user already has an application
  const { data: existingApplication } = await supabase
    .from("vendor_applications")
    .select("status")
    .eq("user_id", user.id)
    .single()

  if (existingApplication) {
    redirect("/vendor-application")
  }

  // Get user profile data to prefill form
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single()

  return (
    <PublicLayout>
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container py-8 md:py-12">
        {/* Back Link */}
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-3">
              Become a Vendor
            </h1>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto">
              Apply to list your vehicles and start earning with our premium transfer service
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4">
            <BenefitCard
              icon={<Building2 className="w-5 h-5" />}
              title="No Upfront Fees"
              description="Join for free - we only charge a small commission on completed bookings"
            />
            <BenefitCard
              icon={<FileText className="w-5 h-5" />}
              title="Quick Approval"
              description="Applications reviewed within 48 hours by our team"
            />
            <BenefitCard
              icon={<CreditCard className="w-5 h-5" />}
              title="Fast Payouts"
              description="Get paid directly to your bank account weekly"
            />
          </div>

          {/* Info Alert */}
          <div className="luxury-card p-4 border-[var(--gold)]/30 bg-[var(--gold)]/5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--gold)] mb-2">Before you apply:</p>
                <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
                  <li>Have your business registration documents ready</li>
                  <li>Ensure your trade license and insurance are current</li>
                  <li>Prepare your banking details for payouts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="luxury-card p-6 md:p-8">
            <h2 className="text-xl font-medium text-[var(--text-primary)] mb-6">
              Application Form
            </h2>
            <VendorApplicationForm
              userId={user.id}
              defaultValues={{
                businessEmail: profile?.email || "",
                businessPhone: profile?.phone || "",
              }}
            />
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-[var(--text-muted)]">
            By submitting this application, you agree to our{" "}
            <Link href="/terms" className="text-[var(--gold)] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/vendor-agreement" className="text-[var(--gold)] hover:underline">
              Vendor Agreement
            </Link>
          </p>
        </div>
      </div>
    </div>
    </PublicLayout>
  )
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="luxury-card p-4 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-muted)]">{description}</p>
    </div>
  )
}
