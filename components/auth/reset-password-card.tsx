"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { inputClass, fieldLabelClass } from "./auth-classes"

export function ResetPasswordCard() {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="break-words">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleUpdatePassword} className="mt-8 flex flex-col gap-5">
        <div>
          <label htmlFor="rp-password" className={fieldLabelClass}>New password</label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              disabled={loading}
              placeholder="At least 8 characters"
              aria-describedby="reset-password-hint"
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-warm)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="rp-confirm" className={fieldLabelClass}>Confirm password</label>
          <div className="relative">
            <input
              id="rp-confirm"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              disabled={loading}
              placeholder="Repeat your password"
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-warm)]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px]"
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
          className="mt-4 inline-flex items-center justify-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </form>
    </motion.div>
  )
}
