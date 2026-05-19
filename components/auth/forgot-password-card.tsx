"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

const inputClass =
  "w-full h-[52px] bg-[var(--black-warm)] border border-[var(--graphite)] rounded-[4px] px-4 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25 transition-[border,box-shadow] duration-200 disabled:opacity-60"

const fieldLabelClass =
  "block text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[var(--text-muted)] mb-2"

export function ForgotPasswordCard() {
  const reduceMotion = useReducedMotion()
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
        setError(data.error || "Failed to send reset link")
      } else {
        setMessage("Check your inbox. Link valid for one hour.")
      }
    } catch (err) {
      console.error("Password reset error:", err)
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
      <div className="editorial-eyebrow">Password recovery</div>
      <h1 className="editorial-headline mt-5 text-[clamp(2rem,4vw,2.75rem)]">
        Send me a <em>reset link.</em>
      </h1>
      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        Enter the email you booked with. We&rsquo;ll send a one-time link valid for one hour.
      </p>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-[rgba(var(--gold-rgb),0.3)] bg-[rgba(var(--gold-rgb),0.06)] p-4 text-[0.875rem] text-[var(--text-primary)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
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
            disabled={loading || !!message}
            placeholder="you@email.com"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!message}
          className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px] disabled:opacity-60"
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
          className="mt-2 inline-flex items-center justify-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to sign in
        </Link>
      </form>
    </motion.div>
  )
}
