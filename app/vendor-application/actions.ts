"use server"

import { after } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAdminEmail, getAppUrl } from "@/lib/email/config"
import { sendNewVendorApplicationNotificationEmail } from "@/lib/email/services/admin-emails"
import { sendVendorApplicationReceivedEmail } from "@/lib/email/services/vendor-emails"
import { formatBookingDate } from "@/lib/utils/timezone"
import { createApplicationSchema } from "@/components/vendor-application/schema"
import { vendorApplicationSchema } from "./schemas"
import * as z from "zod"

/** Postgres unique_violation. `registration_number` is globally unique with no status predicate. */
const UNIQUE_VIOLATION = "23505"

/**
 * The columns an applicant owns, in the shape the table stores them.
 *
 * Shared by the edit and the resubmit path so a field cannot be saved by one and dropped
 * by the other. The two JSON blobs are the only place the flat form fields are folded up.
 */
function applicationColumns(data: z.infer<typeof vendorApplicationSchema>) {
  return {
    business_name: data.businessName,
    business_email: data.businessEmail,
    business_phone: data.businessPhone,
    business_address: data.businessAddress,
    business_city: data.businessCity,
    business_country_code: data.businessCountryCode,
    business_description: data.businessDescription || null,
    registration_number: data.registrationNumber,
    documents: {
      trade_license_number: data.tradeLicenseNumber,
      trade_license_expiry: data.tradeLicenseExpiry,
      insurance_policy_number: data.insurancePolicyNumber,
      insurance_expiry: data.insuranceExpiry,
    },
    banking_details: {
      bank_name: data.bankName || null,
      account_holder_name: data.accountHolderName || null,
      account_number: data.accountNumber || null,
      iban: data.iban || null,
      swift_code: data.swiftCode || null,
    },
    updated_at: new Date().toISOString(),
  }
}

export async function updateVendorApplication(
  applicationId: string,
  values: z.infer<typeof vendorApplicationSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Verify the application belongs to the user and is pending
    const { data: application, error: fetchError } = await supabase
      .from("vendor_applications")
      .select("user_id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      return { error: "Application not found" }
    }

    if (application.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    if (application.status !== "pending") {
      return { error: "Only pending applications can be updated" }
    }

    // Parsed here, not only typed. The schema was previously used for the argument type
    // alone, so an edit could blank a field the create form insists on, including the
    // business email that the approval and rejection notices are addressed to.
    const parsed = vendorApplicationSchema.safeParse(values)
    if (!parsed.success) {
      return { error: "Please check the form and try again" }
    }
    const data = parsed.data

    // Update the application.
    // The status filter is repeated here so the write is scoped in SQL, not only by
    // the read-then-write check above (which races an admin approving concurrently).
    const { data: updated, error: updateError } = await supabase
      .from("vendor_applications")
      .update(applicationColumns(data))
      .eq("id", applicationId)
      .eq("status", "pending")
      .select("id")

    if (updateError) {
      console.error("Update error:", updateError)
      return { error: "Failed to update application" }
    }

    // A zero-row update is not an error in PostgREST, so without this check an
    // RLS-blocked write would report success and silently discard the changes.
    if (!updated || updated.length === 0) {
      console.error("Update matched no rows for application", applicationId)
      return { error: "Your changes could not be saved. Please refresh and try again." }
    }

    revalidatePath("/vendor-application")
    revalidatePath("/vendor-application/edit")
    return {}
  } catch (error) {
    console.error("Update vendor application error:", error)
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Put a rejected application back into the review queue.
 *
 * The applicant keeps the one row they are allowed to have: `one_application_per_user` and
 * the INSERT policy are unchanged, so this is an edit that also flips the status. The
 * database owns what happens to the decision the row was carrying: a BEFORE UPDATE trigger
 * appends it to `review_history` and clears `rejection_reason`, `reviewed_at`, `reviewed_by`
 * and `admin_notes`. Nothing here writes those columns.
 *
 * Parsed against the create schema rather than the shared one. A resubmission is a fresh
 * submission, so a trade license or insurance that has since lapsed must fail. The edit
 * path deliberately tolerates an expired document, because there the row is already in
 * review and the applicant is only correcting a detail.
 */
export async function resubmitVendorApplication(
  applicationId: string,
  values: z.infer<typeof vendorApplicationSchema>
): Promise<{ error?: string; code?: "duplicate_registration" }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { data: application, error: fetchError } = await supabase
      .from("vendor_applications")
      .select("user_id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      return { error: "Application not found" }
    }

    if (application.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    if (application.status !== "rejected") {
      return { error: "Only a declined application can be resubmitted" }
    }

    const parsed = createApplicationSchema.safeParse(values)
    if (!parsed.success) {
      return { error: "Please check the form and try again" }
    }
    const data = parsed.data

    // One write: the applicant's fields and the status flip together, so a resubmission
    // can never leave edited details sitting behind a status that is still declined.
    // The status filter is repeated in SQL for the same reason the edit path repeats it.
    const { data: updated, error: updateError } = await supabase
      .from("vendor_applications")
      .update({ ...applicationColumns(data), status: "pending" })
      .eq("id", applicationId)
      .eq("status", "rejected")
      .select("id")

    if (updateError) {
      // registration_number is unique across every application with no status predicate,
      // so an applicant correcting theirs can collide with somebody else's.
      if (updateError.code === UNIQUE_VIOLATION && updateError.message?.includes("registration_number")) {
        return { code: "duplicate_registration", error: "That registration number is already on another application" }
      }

      console.error("Resubmit error:", updateError)
      return { error: "Failed to resubmit application" }
    }

    // A zero-row update is not an error in PostgREST, so without this check an
    // RLS-blocked write would report success and silently discard the changes.
    if (!updated || updated.length === 0) {
      console.error("Resubmit matched no rows for application", applicationId)
      return { error: "Your application could not be resubmitted. Please refresh and try again." }
    }

    // Notify the admin and confirm to the applicant, on the same terms as the first
    // submission: after(), because the row is already committed and awaiting the mail API
    // would only hold the submit button open. See app/become-vendor/actions.ts.
    after(async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single()

        const applicantName = profile?.full_name || data.businessName
        const submittedDate = formatBookingDate(new Date())
        const applicantEmail = profile?.email || user.email || data.businessEmail || ""

        const [adminResult, applicantResult] = await Promise.allSettled([
          sendNewVendorApplicationNotificationEmail({
            adminEmail: getAdminEmail(),
            applicationId,
            applicationReference: applicationId,
            applicantName,
            applicantEmail: data.businessEmail || profile?.email || user.email || "",
            businessPhone: data.businessPhone || "Not provided",
            companyName: data.businessName,
            submittedDate,
            applicationDetailsUrl: `${getAppUrl()}/admin/vendor-applications/${applicationId}`,
          }),
          applicantEmail
            ? sendVendorApplicationReceivedEmail({
                email: applicantEmail,
                name: applicantName,
                applicationReference: applicationId,
                submittedDate,
              })
            : Promise.resolve({ success: false, error: "no applicant email on file" }),
        ])

        if (adminResult.status === "rejected") {
          console.error("[VendorApplicationResubmit] admin notification threw:", adminResult.reason)
        } else if (!adminResult.value.success) {
          console.error("[VendorApplicationResubmit] admin notification failed:", adminResult.value.error)
        }

        if (applicantResult.status === "rejected") {
          console.error("[VendorApplicationResubmit] applicant confirmation threw:", applicantResult.reason)
        } else if (!applicantResult.value.success) {
          console.error(
            "[VendorApplicationResubmit] applicant confirmation failed:",
            applicantResult.value.error
          )
        }
      } catch (emailError) {
        console.error("[VendorApplicationResubmit] notification error:", emailError)
      }
    })

    revalidatePath("/vendor-application")
    revalidatePath("/vendor-application/edit")
    return {}
  } catch (error) {
    console.error("Resubmit vendor application error:", error)
    return { error: "An unexpected error occurred" }
  }
}
