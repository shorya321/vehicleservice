"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, Eye, EyeOff } from "lucide-react"

/**
 * ResetPasswordCard Component
 *
 * Luxury-themed password reset card following the Infinia design system.
 * Matches the styling of AuthFormCard for visual consistency.
 * Includes session validation and password requirements.
 */
export function ResetPasswordCard() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/forgot-password')
      }
    }
    checkSession()
  }, [supabase, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        // Successfully updated password, redirect to login
        router.push('/login?message=Password updated successfully')
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
      className="auth-card auth-card-luxury"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth-card-inner relative z-10">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="auth-icon w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[rgba(198,170,136,0.15)] to-[rgba(198,170,136,0.05)] border border-[rgba(198,170,136,0.25)] rounded-2xl">
            <Lock className="w-7 h-7 stroke-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
            Set New Password
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your new password below
          </p>
        </div>

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
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
          {/* New Password Input */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="form-input-wrapper">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="luxury-input has-icon h-14 pr-12"
              />
              <Lock className="form-input-icon" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-input-wrapper">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="luxury-input has-icon h-14 pr-12"
              />
              <Lock className="form-input-icon" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="px-2 py-3 bg-[rgba(42,40,38,0.3)] border border-[rgba(198,170,136,0.1)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)] mb-2">Password must:</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 ml-4">
              <li className="list-disc">Be at least 6 characters long</li>
              <li className="list-disc">Match in both fields</li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-14 text-[0.8125rem] font-semibold tracking-wider uppercase"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}
