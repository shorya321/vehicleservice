"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LuxuryButton } from '@/components/business/ui/luxury-button'
import { LuxuryInput, LuxuryLabel } from '@/components/business/ui/luxury-input'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle, HelpCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import '@/app/business/globals.css'
import { useReducedMotion } from '@/lib/business/animation/hooks'

/**
 * Business Forgot Password Page
 *
 * Allows business users to request a password reset email.
 * Works on main domain, subdomains, and custom domains.
 * API handles domain context and security validation.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const iconBadgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
}

const alertVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
}

export default function BusinessForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else if (message) {
      setCanResend(true)
    }
  }, [resendTimer, message])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    setCanResend(false)

    try {
      // Call API endpoint - domain context handled server-side
      const response = await fetch('/api/business/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to send reset link')
      } else {
        setMessage("Check your email for the password reset link!")
        setResendTimer(60) // 60 second cooldown
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setResendTimer(60)
    setMessage(null)

    try {
      setLoading(true)
      const response = await fetch('/api/business/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to resend reset link')
        setCanResend(true)
        setResendTimer(0)
      } else {
        setMessage("Reset link sent again! Check your email.")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setCanResend(true)
      setResendTimer(0)
    } finally {
      setLoading(false)
    }
  }

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div

  return (
    <div className="min-h-screen flex items-center justify-center p-4 business-mesh-bg">
      <MotionWrapper
        {...(!prefersReducedMotion && {
          initial: "hidden",
          animate: "visible",
          variants: containerVariants,
        })}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <MotionWrapper
            {...(!prefersReducedMotion && { variants: iconBadgeVariants })}
            className="flex justify-center mb-4"
          >
            <div className="p-3 rounded-full bg-[rgba(99,102,241,0.15)]">
              <Mail className="h-8 w-8 text-[var(--business-primary-400)]" />
            </div>
          </MotionWrapper>
          <MotionWrapper {...(!prefersReducedMotion && { variants: itemVariants })}>
            <h1 className="business-text-headline mb-2">Forgot Password</h1>
            <p className="business-text-body text-[var(--business-text-secondary)]">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </MotionWrapper>
        </div>

        {/* Form Card */}
        <MotionWrapper
          {...(!prefersReducedMotion && { variants: itemVariants })}
          className="business-glass-elevated rounded-2xl p-8"
        >
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Success Message */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key="success"
                  variants={alertVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Alert className="border-[var(--business-success)]/50 bg-[var(--business-success)]/10">
                    <CheckCircle className="h-4 w-4 text-[var(--business-success)]" />
                    <AlertDescription className="text-[var(--business-success)]">
                      {message}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  variants={alertVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Alert className="border-[var(--business-error)]/50 bg-[var(--business-error)]/10">
                    <AlertCircle className="h-4 w-4 text-[var(--business-error)]" />
                    <AlertDescription className="text-[var(--business-error)]">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-2">
              <LuxuryLabel htmlFor="email">Business Email</LuxuryLabel>
              <LuxuryInput
                id="email"
                type="email"
                placeholder="contact@acmehotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!message}
              />
            </div>

            {/* Submit Button */}
            <LuxuryButton
              type="submit"
              className="w-full"
              disabled={loading || !!message}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </LuxuryButton>

            {/* Didn't receive email? Help Section */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-[var(--business-border-subtle)]">
                    <div className="flex items-start gap-2 text-sm text-[var(--business-text-muted)]">
                      <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium text-[var(--business-text-secondary)]">
                          Didn't receive the email?
                        </p>
                        <ul className="space-y-1 text-xs">
                          <li>• Check your spam or junk folder</li>
                          <li>• Verify the email address is correct</li>
                          <li>• Make sure you have a registered business account</li>
                        </ul>

                        {/* Resend Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={!canResend || loading}
                            className="inline-flex items-center text-xs font-medium text-[var(--business-primary-400)] hover:text-[var(--business-primary-300)] disabled:text-[var(--business-text-muted)] disabled:cursor-not-allowed transition-colors"
                          >
                            <RefreshCw className={`mr-1.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                            {resendTimer > 0
                              ? `Resend in ${resendTimer}s`
                              : 'Resend reset link'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                href="/business/login"
                className="inline-flex items-center text-sm text-[var(--business-text-secondary)] hover:text-[var(--business-primary-400)] transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </form>
        </MotionWrapper>
      </MotionWrapper>
    </div>
  )
}
