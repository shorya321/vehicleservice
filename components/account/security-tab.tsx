"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { updatePassword, requestAccountDeletion, cancelDeletionRequest } from "@/app/account/actions"
import { passwordChangeSchema, deletionRequestSchema, type PasswordChangeFormData, type DeletionRequestFormData } from "@/app/account/schemas"
import { toast } from "sonner"
import { ContentSection } from "./content-section"

interface SecurityTabProps {
  userId: string
  pendingDeletionRequest?: {
    id: string
    reason: string
    requested_at: string
  } | null
}

export function SecurityTab({ userId, pendingDeletionRequest }: SecurityTabProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showDeleteSection, setShowDeleteSection] = useState(false)
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false)
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false)

  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const deletionForm = useForm<DeletionRequestFormData>({
    resolver: zodResolver(deletionRequestSchema),
    defaultValues: {
      reason: "",
      confirm: false,
    },
  })

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    setIsChangingPassword(true)
    const result = await updatePassword(data.current_password, data.new_password)
    setIsChangingPassword(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Password updated successfully")
      passwordForm.reset()
    }
  }

  const onDeletionSubmit = async (data: DeletionRequestFormData) => {
    setIsRequestingDeletion(true)
    const result = await requestAccountDeletion(userId, data.reason)
    setIsRequestingDeletion(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Deletion request submitted")
      deletionForm.reset()
      setShowDeleteSection(false)
    }
  }

  const handleCancelDeletion = async () => {
    if (!pendingDeletionRequest) return
    setIsCancellingDeletion(true)
    const result = await cancelDeletionRequest(pendingDeletionRequest.id)
    setIsCancellingDeletion(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Deletion request cancelled")
    }
  }

  return (
    <div>
      <ContentSection
        title="Change Password"
        eyebrow="Security"
        description="Update your password to keep your account secure"
      >
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="form-label">Current Password</label>
            <div className="relative">
              <input
                id="current_password"
                type={showCurrentPassword ? "text" : "password"}
                {...passwordForm.register("current_password")}
                className="luxury-input pr-11"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors"
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.current_password && (
              <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new_password" className="form-label">New Password</label>
              <div className="relative">
                <input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("new_password")}
                  className="luxury-input pr-11"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  {...passwordForm.register("confirm_password")}
                  className="luxury-input pr-11"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="text-xs text-[var(--text-muted)] space-y-1">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn btn-primary disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </ContentSection>

      {/* Danger Zone — flat charcoal region, not a card */}
      <div className="mt-16 rounded-lg bg-[var(--charcoal)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-[var(--error-text)]" />
          <div>
            <h3 className="text-base font-medium text-[var(--error-text)]">Delete Account</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>

        {pendingDeletionRequest ? (
          <div className="flex items-start gap-3 p-4 rounded-md bg-[var(--status-pending-bg)]">
            <AlertTriangle className="w-5 h-5 text-[var(--status-pending-text)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--status-pending-text)] mb-1">Deletion Request Pending</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Submitted on {new Date(pendingDeletionRequest.requested_at).toLocaleDateString()}
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={isCancellingDeletion}
                className="text-sm text-[var(--status-pending-text)] hover:opacity-80 underline"
              >
                {isCancellingDeletion ? "Cancelling..." : "Cancel Request"}
              </button>
            </div>
          </div>
        ) : showDeleteSection ? (
          <form onSubmit={deletionForm.handleSubmit(onDeletionSubmit)} className="space-y-4 account-tab-enter">
            <div className="flex items-start gap-3 p-4 rounded-md bg-[var(--status-cancelled-bg)]">
              <AlertTriangle className="w-5 h-5 text-[var(--error-text)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--error-text)]">
                This action is irreversible. All your data including bookings, reviews, and preferences will be permanently deleted.
              </p>
            </div>

            <div>
              <label htmlFor="deletion_reason" className="form-label">Reason for leaving</label>
              <textarea
                id="deletion_reason"
                {...deletionForm.register("reason")}
                className="luxury-input min-h-[100px] resize-none"
                placeholder="Please tell us why you want to delete your account..."
              />
              {deletionForm.formState.errors.reason && (
                <p className="mt-1.5 text-sm text-[var(--error-text)]" role="alert">{deletionForm.formState.errors.reason.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 -m-3.5">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  {...deletionForm.register("confirm")}
                  className="w-4 h-4 rounded border-[var(--status-cancelled-border)] bg-transparent text-[var(--error-text)] focus:ring-[var(--error-text)] cursor-pointer"
                />
              </div>
              <label htmlFor="confirm-delete" className="text-sm text-[var(--text-secondary)]">
                I understand that this action cannot be undone
              </label>
            </div>
            {deletionForm.formState.errors.confirm && (
              <p className="text-sm text-[var(--error-text)]" role="alert">{deletionForm.formState.errors.confirm.message}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteSection(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRequestingDeletion}
                className="btn border border-[var(--status-cancelled-border)] text-[var(--error-text)] hover:bg-[var(--status-cancelled-bg)]"
              >
                {isRequestingDeletion ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Deletion"
                )}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowDeleteSection(true)}
            className="btn border border-[var(--status-cancelled-border)] text-[var(--error-text)] hover:bg-[var(--status-cancelled-bg)]"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </button>
        )}
      </div>
    </div>
  )
}
