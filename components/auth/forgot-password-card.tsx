"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

/**
 * ForgotPasswordCard Component
 *
 * Luxury-themed password reset request card following the Infinia design system.
 * Matches the styling of AuthFormCard for visual consistency.
 */
export function ForgotPasswordCard() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for the password reset link!")
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
      className="auth-card auth-card-luxury"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth-card-inner relative z-10">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="auth-icon w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[rgba(198,170,136,0.15)] to-[rgba(198,170,136,0.05)] border border-[rgba(198,170,136,0.25)] rounded-2xl">
            <Mail className="w-7 h-7 stroke-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
            Password Recovery
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-[var(--gold)]/30 bg-[var(--gold)]/10 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-[var(--gold)]" />
              <AlertDescription className="text-[var(--text-primary)]">
                {message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="form-input-wrapper">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                disabled={loading || !!message}
                className="luxury-input has-icon h-14"
              />
              <Mail className="form-input-icon" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !!message}
            className="btn btn-primary w-full h-14 text-[0.8125rem] font-semibold tracking-wider uppercase"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-[0.8125rem] text-[var(--gold)] hover:text-[var(--gold-light)] font-medium transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
