"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Phone, Loader2 } from "lucide-react"
import { FormDatePicker } from "@/components/ui/form-date-picker"
import { parse } from "date-fns"
import { updateProfile } from "@/app/account/actions"
import { personalInfoSchema, type PersonalInfoFormData } from "@/app/account/schemas"
import { toast } from "sonner"
import { ContentSection } from "./content-section"
import { AvatarUpload } from "./avatar-upload"
import { ProfileChecklist } from "./profile-checklist"

interface PersonalInfoTabProps {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
  }
  /** Lets the checklist send the customer to Security in place, the way the rail does. */
  onTabChange?: (tab: "security") => void
}

export function PersonalInfoTab({ user, onTabChange }: PersonalInfoTabProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      full_name: user.full_name || "",
      phone: user.phone || "",
      date_of_birth: user.date_of_birth || "",
      address_street: user.address_street || "",
      address_city: user.address_city || "",
      address_country: user.address_country || "",
    },
  })

  const onSubmit = async (data: PersonalInfoFormData) => {
    setIsLoading(true)
    const result = await updateProfile(user.id, data)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Profile updated successfully")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="account-split">
      <div className="min-w-0">
      <ContentSection
        title="The details we travel on"
        eyebrow="Profile"
        description="A chauffeur calls the number on this page when a pickup point is busy. Everything else is optional, and none of it is needed to book."
      >
        {/* The photo moved here from the rail, where it sat under a page header carrying the
            same name and email. */}
        <AvatarUpload
          userId={user.id}
          fullName={user.full_name}
          email={user.email}
          avatarUrl={user.avatar_url}
        />

        <div className="form-subsection">
          <h3 className="account-eyebrow">Who is travelling</h3>
        </div>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="full_name"
                  {...form.register("full_name")}
                  className="luxury-input pl-11"
                  placeholder="Enter your full name"
                  aria-invalid={!!form.formState.errors.full_name}
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="phone"
                  {...form.register("phone")}
                  className="luxury-input pl-11"
                  placeholder="+1 (555) 000-0000"
                  aria-invalid={!!form.formState.errors.phone}
                />
              </div>
              {form.formState.errors.phone && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                aria-disabled="true"
                className="luxury-input bg-[var(--charcoal)] text-[var(--text-muted)] cursor-not-allowed opacity-60"
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">Email is verified and cannot be changed directly. Contact support if needed.</p>
            </div>

            <div>
              <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
              <FormDatePicker
                value={form.watch("date_of_birth") ? parse(form.watch("date_of_birth") as string, "yyyy-MM-dd", new Date()) : undefined}
                onChange={(date) => {
                  const formatted = date ? new Intl.DateTimeFormat("en-CA").format(date) : ""
                  form.setValue("date_of_birth", formatted, { shouldValidate: true })
                }}
                disabled={(date) => date > new Date()}
                placeholder="Select date of birth"
                captionLayout="dropdown"
                startMonth={new Date(1930, 0)}
                endMonth={new Date()}
                className="luxury-input"
                dateFormat="PPP"
              />
              {form.formState.errors.date_of_birth && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{form.formState.errors.date_of_birth.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-subsection">
          <h3 className="account-eyebrow">Billing address</h3>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
            Printed on your receipts. Never used for a pickup.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1">
            <div>
              <label htmlFor="address_street" className="form-label">Street Address</label>
              <input
                id="address_street"
                {...form.register("address_street")}
                className="luxury-input"
                placeholder="Enter your street address"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address_city" className="form-label">City</label>
              <input
                id="address_city"
                {...form.register("address_city")}
                className="luxury-input"
                placeholder="Enter your city"
              />
            </div>
            <div>
              <label htmlFor="address_country" className="form-label">Country</label>
              <input
                id="address_country"
                {...form.register("address_country")}
                className="luxury-input"
                placeholder="Enter your country"
              />
            </div>
          </div>
        </div>

        {/* The save button is greyed until the form is dirty, which is right, but on a page
            opened with nothing typed that left a pale button floating in space with no
            explanation. It sits on a hairline now, beside a line saying what saving does, and a
            way back out appears only once there is something to discard. */}
        <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
            Changes apply to transfers you book from now on.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-shrink-0">
            {form.formState.isDirty && (
              <button
                type="button"
                onClick={() => form.reset()}
                disabled={isLoading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Discard
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </ContentSection>
      </div>

      <ProfileChecklist user={user} onTabChange={onTabChange} />
      </div>
    </form>
  )
}
