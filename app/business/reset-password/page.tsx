"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LuxuryButton } from '@/components/business/ui/luxury-button'
import { LuxuryInput, LuxuryLabel } from '@/components/business/ui/luxury-input'
import { PasswordStrength } from '@/components/business/ui/password-strength'
import { RequirementsChecklist } from '@/components/business/ui/requirements-checklist'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import '@/app/business/globals.css'
import { useReducedMotion } from '@/lib/business/animation/hooks'

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

/**
 * Business Reset Password Page
 *
 * Allows business users to set a new password after requesting a reset.
 * Validates token from URL and updates password via API.
 * Works on main domain, subdomains, and custom domains.
 */
export default function BusinessResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const prefersReducedMotion = useReducedMotion()

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div

  useEffect(() => {
    // Check if we have a valid token from the reset link
    if (!token) {
      router.push('/business/forgot-password')
    }
  }, [token, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!token) {
      setError("Invalid reset token")
      return
    }

    setLoading(true)

    try {
      // Call API endpoint with token and new password
      const response = await fetch('/api/business/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update password')
      } else {
        // Successfully updated password, redirect to business login
        router.push('/business/login?message=Password updated successfully')
      }
    } catch (err) {
      console.error("Password update error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

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
              <Lock className="h-8 w-8 text-[var(--business-primary-400)]" />
            </div>
          </MotionWrapper>
          <MotionWrapper {...(!prefersReducedMotion && { variants: itemVariants })}>
            <h1 className="business-text-headline mb-2">Reset Password</h1>
            <p className="business-text-body text-[var(--business-text-secondary)]">Enter your new password below</p>
          </MotionWrapper>
        </div>

        {/* Form Card */}
        <MotionWrapper
          {...(!prefersReducedMotion && { variants: itemVariants })}
          className="business-glass-elevated rounded-2xl p-8"
        >
          <form onSubmit={handleUpdatePassword} className="space-y-6">
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

            {/* New Password Input */}
            <div className="space-y-2">
              <LuxuryLabel htmlFor="password">New Password</LuxuryLabel>
              <LuxuryInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[var(--business-text-muted)] hover:text-[var(--business-text-primary)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <LuxuryLabel htmlFor="confirmPassword">Confirm Password</LuxuryLabel>
              <LuxuryInput
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-[var(--business-text-muted)] hover:text-[var(--business-text-primary)] transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrength password={password} />

            {/* Interactive Password Requirements */}
            <RequirementsChecklist
              password={password}
              confirmPassword={confirmPassword}
            />

            {/* Submit Button */}
            <LuxuryButton
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </LuxuryButton>
          </form>
        </MotionWrapper>
      </MotionWrapper>
    </div>
  )
}
