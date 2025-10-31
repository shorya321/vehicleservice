"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, Eye, EyeOff } from "lucide-react"

/**
 * Reset Password Page
 *
 * Luxury-themed password reset page following the Infinia design system.
 * Features:
 * - Ambient animated background with floating gold orbs
 * - Glassmorphism card with backdrop blur
 * - Form inputs with left-aligned icons and password visibility toggle
 * - Proper luxury color palette (gold, pearl, black)
 * - Framer Motion entrance animations
 * - Accessible keyboard navigation and ARIA labels
 * - Password validation and confirmation
 */
export default function ResetPasswordPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-luxury-black px-4 py-12 relative overflow-hidden">
      {/* Ambient Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="h-16 w-16 rounded-lg bg-luxury-gold/10 backdrop-blur-sm border border-luxury-gold/30 flex items-center justify-center">
                <Lock className="h-9 w-9" style={{ color: "#C6AA88" }} />
              </div>
            </motion.div>
            <h1 className="font-serif text-3xl md:text-4xl text-luxury-pearl mb-2">
              Reset Password
            </h1>
            <p className="text-luxury-lightGray text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* New Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-luxury-lightGray">
                New Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10"
                  style={{ color: "#C6AA88" }}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 pl-12 pr-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: "#C6AA88" }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: "#C6AA88" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-luxury-lightGray">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10"
                  style={{ color: "#C6AA88" }}
                />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 pl-12 pr-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: "#C6AA88" }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: "#C6AA88" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-luxury-lightGray/70 space-y-1">
              <p>Password must:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Be at least 6 characters long</li>
                <li>Match in both fields</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans uppercase tracking-wider font-semibold transition-all duration-300 active:scale-95"
              disabled={loading}
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
    </div>
  )
}
