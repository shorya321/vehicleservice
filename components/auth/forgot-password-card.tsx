"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { inputClass, fieldLabelClass } from "./auth-classes"

export function ForgotPasswordCard() {
  const reduceMotion = useReducedMotion()
  const searchParams = useSearchParams()
  const [expired] = useState(() => searchParams.get("expired") === "true")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "We couldn't send the reset link. Double-check your email and try again.")
      } else {
        setMessage("Check your inbox for the reset link.")
      }
    } catch (err) {
      console.error("Password reset error:", err)
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
      <div className="editorial-eyebrow">Password recovery</div>
      <h1 className="editorial-headline mt-6">
        Send me a <em>reset link.</em>
      </h1>
      <p className="editorial-body mt-6 max-w-md">
        Enter the email you booked with. We&rsquo;ll send a one-time link valid for one hour.
      </p>

      {expired && !message && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="break-words">Your reset link has expired. Enter your email to get a new one.</p>
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-[rgba(var(--gold-rgb),0.3)] bg-[rgba(var(--gold-rgb),0.06)] p-4 text-[0.875rem] text-[var(--text-primary)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
          <p className="break-words">{message}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="break-words">{error}</p>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="mt-8 flex flex-col gap-5">
        <div>
          <label htmlFor="fp-email" className={fieldLabelClass}>Email</label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            disabled={loading || !!message}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!message}
          className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <Link
          href="/login"
          className="mt-2 inline-flex items-center justify-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to sign in
        </Link>
      </form>
    </motion.div>
  )
}
