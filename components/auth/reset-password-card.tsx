"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"

const inputClass =
  "w-full h-12 bg-[var(--black-warm)] border border-[var(--graphite)] rounded-[4px] px-4 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25 transition-[border,box-shadow] duration-200 disabled:opacity-60"

const fieldLabelClass =
  "block text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[var(--text-muted)] mb-2"

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
    router.push("/forgot-password")
    return null
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
        setError(data.error || "Failed to update password")
      } else {
        router.push("/login?message=Password updated successfully")
      }
    } catch (err) {
      console.error("Password update error:", err)
      setError("An unexpected error occurred")
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
      <h1 className="editorial-headline mt-5 text-[clamp(2rem,4vw,2.75rem)]">
        Pick a fresh <em>password.</em>
      </h1>
      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        Minimum 8 characters. Use whatever your password manager generates.
      </p>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-8 flex items-start gap-3 border border-[#ef4444]/40 bg-[#ef4444]/10 p-4 text-[0.875rem] text-[#fca5a5]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

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
              disabled={loading}
              placeholder="At least 8 characters"
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
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
              disabled={loading}
              placeholder="Repeat your password"
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary mt-2 h-12 w-full disabled:opacity-60"
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
    </motion.div>
  )
}
