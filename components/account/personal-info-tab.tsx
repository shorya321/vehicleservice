"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Phone, Calendar, MapPin, Loader2 } from "lucide-react"
import { updateProfile } from "@/app/account/actions"
import { personalInfoSchema, type PersonalInfoFormData } from "@/app/account/schemas"
import { toast } from "sonner"

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
    <div className="account-section">
      <div className="account-section-header">
        <div className="account-section-icon">
          <User className="w-5 h-5 text-[var(--gold)]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Personal Information</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Update your personal details to complete your profile
          </p>
        </div>
      </div>

      <div className="account-section-content">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name & Phone Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  {...form.register("full_name")}
                  className="luxury-input pl-11"
                  placeholder="Enter your full name"
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  {...form.register("phone")}
                  className="luxury-input pl-11"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {form.formState.errors.phone && (
                <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Email (Read-only) & DOB Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="luxury-input bg-[var(--charcoal)] text-[var(--text-muted)] cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">Email cannot be changed</p>
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="date"
                  {...form.register("date_of_birth")}
                  className="luxury-input pl-11"
                />
              </div>
              {form.formState.errors.date_of_birth && (
                <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.date_of_birth.message}</p>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="form-subsection">
            <div className="form-subsection-header">
              <MapPin className="w-4 h-4" />
              Address Information
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Street Address</label>
                <input
                  {...form.register("address_street")}
                  className="luxury-input"
                  placeholder="Enter your street address"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    {...form.register("address_city")}
                    className="luxury-input"
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input
                    {...form.register("address_country")}
                    className="luxury-input"
                    placeholder="Enter your country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !form.formState.isDirty}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    </div>
  )
}
