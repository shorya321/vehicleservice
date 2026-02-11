"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Eye, EyeOff, AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { updatePassword, requestAccountDeletion, cancelDeletionRequest } from "@/app/account/actions"
import { passwordChangeSchema, deletionRequestSchema, type PasswordChangeFormData, type DeletionRequestFormData } from "@/app/account/schemas"
import { toast } from "sonner"

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
    <div className="space-y-6">
      {/* Password Change Section */}
      <div className="account-section">
        <div className="account-section-header">
          <div className="account-section-icon">
            <Lock className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Change Password</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <div className="account-section-content">
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...passwordForm.register("current_password")}
                className="luxury-input pr-11"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.current_password && (
              <p className="mt-1.5 text-sm text-red-400">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("new_password")}
                  className="luxury-input pr-11"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="mt-1.5 text-sm text-red-400">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...passwordForm.register("confirm_password")}
                  className="luxury-input pr-11"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="mt-1.5 text-sm text-red-400">{passwordForm.formState.errors.confirm_password.message}</p>
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
        </div>
      </div>

      {/* Account Deletion Section */}
      <div className="account-section border-red-500/20">
        <div className="account-section-header">
          <div className="account-section-icon border-red-500/30 bg-red-500/15">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-400">Delete Account</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>

        <div className="account-section-content">
          {pendingDeletionRequest ? (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400 mb-1">Deletion Request Pending</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Submitted on {new Date(pendingDeletionRequest.requested_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={handleCancelDeletion}
                    disabled={isCancellingDeletion}
                    className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                  >
                    {isCancellingDeletion ? "Cancelling..." : "Cancel Request"}
                  </button>
                </div>
              </div>
            </div>
          ) : showDeleteSection ? (
            <form onSubmit={deletionForm.handleSubmit(onDeletionSubmit)} className="space-y-4">
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">
                    This action is irreversible. All your data including bookings, reviews, and preferences will be permanently deleted.
                  </p>
                </div>
              </div>

              <div>
                <label className="form-label">Reason for leaving</label>
                <textarea
                  {...deletionForm.register("reason")}
                  className="luxury-input min-h-[100px] resize-none"
                  placeholder="Please tell us why you want to delete your account..."
                />
                {deletionForm.formState.errors.reason && (
                  <p className="mt-1.5 text-sm text-red-400">{deletionForm.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  {...deletionForm.register("confirm")}
                  className="w-4 h-4 rounded border-red-500/50 bg-transparent text-red-500 focus:ring-red-500"
                />
                <label htmlFor="confirm-delete" className="text-sm text-[var(--text-secondary)]">
                  I understand that this action cannot be undone
                </label>
              </div>
              {deletionForm.formState.errors.confirm && (
                <p className="text-sm text-red-400">{deletionForm.formState.errors.confirm.message}</p>
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
                  className="btn bg-red-500 hover:bg-red-600 text-white"
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
              className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
