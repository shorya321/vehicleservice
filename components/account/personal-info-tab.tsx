"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Phone, Calendar, Loader2 } from "lucide-react"
import { updateProfile } from "@/app/account/actions"
import { personalInfoSchema, type PersonalInfoFormData } from "@/app/account/schemas"
import { toast } from "sonner"
import { ContentSection } from "./content-section"

interface PersonalInfoTabProps {
  user: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
  }
}

export function PersonalInfoTab({ user }: PersonalInfoTabProps) {
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
      <ContentSection
        title="Personal Information"
        description="Update your personal details to complete your profile"
      >
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
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="date_of_birth"
                  type="date"
                  {...form.register("date_of_birth")}
                  className="luxury-input pl-11"
                  aria-invalid={!!form.formState.errors.date_of_birth}
                />
              </div>
              {form.formState.errors.date_of_birth && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{form.formState.errors.date_of_birth.message}</p>
              )}
            </div>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Address">
        <div className="space-y-4">
          <div>
            <label htmlFor="address_street" className="form-label">Street Address</label>
            <input
              id="address_street"
              {...form.register("address_street")}
              className="luxury-input"
              placeholder="Enter your street address"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !form.formState.isDirty}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
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
      </ContentSection>
    </form>
  )
}
