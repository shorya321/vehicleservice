import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ApplicationDossier, type VendorApplicationRow } from "@/components/vendor-application/application-dossier"
import { ReviewRail } from "@/components/vendor-application/review-rail"
import { RouteBandMap } from "@/app/search/results/components/route-band-map"
import { formatBookingDate } from "@/lib/utils/timezone"
import { normalizeApplicationStatus, REVIEW_WINDOW_HOURS } from "@/lib/vendor-application/status"

export const metadata: Metadata = {
  title: "Vendor Application Status | Track Your Application",
  description: "Track the status of your vendor application",
}

export default async function VendorApplicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/vendor-application")
  }

  const { data: application, error } = await supabase
    .from("vendor_applications")
    .select(`*, reviewer:profiles!vendor_applications_reviewed_by_fkey(full_name, email)`)
    .eq("user_id", user.id)
    .single()

  if (error || !application) {
    redirect("/become-vendor")
  }

  const status = normalizeApplicationStatus(application.status)
  const row = application as unknown as VendorApplicationRow

  return (
    <div className="relative bg-[var(--black-void)]">
      {/* The search page's crop of the street map behind the title, rather than the home
          hero's wider one: same city and tokens, closer in, no runways. Laid out and faded
          by `.vendor-mapband`, which also retires the band's own fade (globals.css). */}
      <div className="vendor-mapband" aria-hidden="true">
        <RouteBandMap />
        <div className="vendor-mapband__fade" />
      </div>

      <div className="relative luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        <div className="mx-auto max-w-[1100px]">
          <Link href="/account" className="account-action">
            <span aria-hidden="true">&larr;</span> Back to account
          </Link>

          <header className="mt-6">
            <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Partner programme</p>
            <h1 className="mt-[0.5rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
              Your application
            </h1>
            <p className="numeric mt-3 text-[0.875rem] text-[var(--text-secondary)]">
              Submitted {formatBookingDate(row.created_at)}
              {/* become-vendor's own promise, while it is still one to keep. */}
              {status === "pending" && `. We reply by email within ${REVIEW_WINDOW_HOURS} hours, either way.`}
            </p>
          </header>

          <div className="mt-[clamp(2.5rem,5vw,3.5rem)] lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16 xl:gap-20">
            <ReviewRail
              status={status}
              createdAt={row.created_at}
              updatedAt={row.updated_at}
              reviewedAt={row.reviewed_at ?? null}
              resubmitted={(row.review_history?.length ?? 0) > 0}
              className="lg:sticky lg:top-28 lg:self-start"
            />
            <ApplicationDossier application={row} status={status} className="mt-10 lg:mt-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
