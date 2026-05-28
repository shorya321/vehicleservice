"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { inputClass, fieldLabelClass } from "./auth-classes"
import { fadeEntrance, fadeAlert } from "@/lib/auth/motion"

export function ForgotPasswordCard() {
  const reduceMotion = useReducedMotion()
  const searchParams = useSearchParams()
  const [expired] = useState(() => searchParams.get("expired") === "true")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.SubmitEvent) => {
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
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const alertState = message ? "success" : error ? "error" : (expired && !message) ? "expired" : null

  return (
    <motion.div {...fadeEntrance(reduceMotion)}>
      <div className="editorial-eyebrow">Password recovery</div>
      <h1 className="editorial-headline mt-6">
        Send me a <em>reset link.</em>
      </h1>
      <p className="editorial-body mt-6 max-w-md">
        Enter the email you booked with. We&rsquo;ll send a one-time link valid for one hour.
      </p>

      <AnimatePresence mode="wait">
        {alertState === "expired" && (
          <motion.div
            key="expired"
            role="alert"
            aria-live="assertive"
            {...fadeAlert}
            className="mt-8 auth-alert-error auth-alert-text text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="break-words">Your reset link has expired. Enter your email to get a new one.</p>
          </motion.div>
        )}
        {alertState === "success" && (
          <motion.div
            key="success"
            role="status"
            aria-live="polite"
            {...fadeAlert}
            className="mt-8 auth-alert-success auth-alert-text text-[var(--text-primary)]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <p className="break-words">{message}</p>
          </motion.div>
        )}
        {alertState === "error" && (
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

      <form onSubmit={handleResetPassword} className="mt-8 flex flex-col gap-6">
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
          className="btn btn-primary mt-5 h-[52px] w-full rounded-[4px]"
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
          className="mt-2 inline-flex items-center justify-center gap-2 auth-label-link auth-text-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </form>
    </motion.div>
  )
}
