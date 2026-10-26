"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Loader2, AlertCircle, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { CustomerPasswordField } from "./customer-field"
import { CustomerAuthIntro, CustomerAuthTrust } from "./customer-auth-intro"
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
      <CustomerAuthIntro screen="reset" bodyId="reset-password-hint" />

      <div className="cauth-card cauth-card--spaced">
        <div className="cauth-card-body">
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                role="alert"
                aria-live="assertive"
                {...fadeAlert}
                className="cauth-alert auth-alert-error auth-alert-text text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="break-words">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleUpdatePassword} className="cauth-form">
            <CustomerPasswordField
              id="rp-password"
              label="New password"
              icon={Lock}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              disabled={loading}
              placeholder="At least 8 characters"
              ariaDescribedBy="reset-password-hint"
              minLength={8}
              labelAside={
                <span className={`cauth-count${password.length >= 8 ? " cauth-count--ok" : ""}`} aria-hidden="true">
                  {password.length}/8
                </span>
              }
            />
            <CustomerPasswordField
              id="rp-confirm"
              label="Confirm password"
              icon={Lock}
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
              className="cauth-submit"
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
          </form>
        </div>

        <div className="cauth-tear" aria-hidden="true" />
        <div className="cauth-card-foot">
          <Link href="/login" className="cauth-back">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>

      <CustomerAuthTrust screen="reset" />
    </motion.div>
  )
}
