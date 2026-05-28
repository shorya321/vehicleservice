"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PasswordField } from "./password-field"
import { fadeEntrance, fadeAlert } from "@/lib/auth/motion"

export function ResetPasswordCard() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    router.push("/forgot-password?expired=true")
    return null
  }

  const handleUpdatePassword = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "We couldn't update your password. The link may have expired.")
      } else {
        router.push("/login?message=Password updated successfully")
      }
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div {...fadeEntrance(reduceMotion)}>
      <div className="editorial-eyebrow">Set new password</div>
      <h1 className="editorial-headline mt-6">
        Pick a fresh <em>password.</em>
      </h1>
      <p id="reset-password-hint" className="editorial-body mt-6 max-w-md">
        Minimum 8 characters. Use whatever your password manager generates.
      </p>

      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            role="alert"
            aria-live="assertive"
            {...fadeAlert}
            className="mt-8 auth-alert-error auth-alert-text text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="break-words">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleUpdatePassword} className="mt-8 flex flex-col gap-6">
        <PasswordField
          id="rp-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={loading}
          placeholder="At least 8 characters"
          ariaDescribedBy="reset-password-hint"
          minLength={8}
        />
        <PasswordField
          id="rp-confirm"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          disabled={loading}
          placeholder="Repeat your password"
          minLength={8}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-5 h-[52px] w-full rounded-[4px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating
            </>
          ) : (
            "Update password"
          )}
        </button>

        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center gap-2 auth-label-link auth-text-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </form>
    </motion.div>
  )
}
