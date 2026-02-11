"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { adminLogin } from "./actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, FileText } from "lucide-react"
import Link from "next/link"
import styles from "./login.module.css"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await adminLogin(email, password)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Successful login, redirect to admin dashboard
        router.push('/admin/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-luxury-void px-4 py-8 relative overflow-hidden ${styles.loginPage}`}>
      {/* Ambient Orbs */}
      <div className={`${styles.ambientOrb} ${styles.ambientOrb1}`} />
      <div className={`${styles.ambientOrb} ${styles.ambientOrb2}`} />
      <div className={`${styles.ambientOrb} ${styles.ambientOrb3}`} />

      {/* Centered Container */}
      <motion.div
        className="w-full max-w-[480px] relative z-[1]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Page Header */}
        <motion.header
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] font-light mb-2 text-luxury-pearl tracking-tight leading-none">
            Admin <span className={styles.goldText}>Portal</span>
          </h1>
          <p className="text-[0.9375rem] text-luxury-textSecondary tracking-wide">
            Sign in to manage the Infinia platform
          </p>
          <div className={styles.divider}>
            <span className={styles.dividerDiamond} />
          </div>
        </motion.header>

        {/* Auth Card */}
        <motion.div
          className={styles.authCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative z-[1]">
            {/* Card Header */}
            <div className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl border border-luxury-gold/25"
                style={{ background: 'linear-gradient(135deg, rgba(198, 170, 136, 0.15) 0%, rgba(198, 170, 136, 0.05) 100%)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
              >
                <Shield className="h-7 w-7 text-luxury-gold" />
              </motion.div>
              <h2 className="font-serif text-2xl font-normal text-luxury-pearl mb-2">Admin Access</h2>
              <p className="text-sm text-luxury-textMuted">Authorized personnel only</p>
            </div>

            {/* Restricted Access Notice */}
            <div className={styles.restrictedNotice}>
              <Lock className="w-4 h-4 text-luxury-goldDark flex-shrink-0" />
              <span>This area is restricted to authorized administrators</span>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 mb-6">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-luxury-gold mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-textMuted pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@infinia.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-luxury-gold mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-textMuted pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={`${styles.formInput} ${styles.formInputWithToggle}`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-between flex-wrap gap-4 max-sm:flex-col max-sm:items-start">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-[18px] h-[18px] accent-luxury-gold cursor-pointer" />
                  <span className="text-[0.8125rem] text-luxury-textSecondary">Remember this device</span>
                </label>
                <Link href="/forgot-password" className="text-[0.8125rem] text-luxury-gold hover:text-luxury-goldLight transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Trust Indicators Row */}
        <motion.div
          className={styles.trustRow}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.trustItem}>
            <Lock className="w-4 h-4 text-luxury-goldDark flex-shrink-0" />
            <span>256-bit Encrypted</span>
          </div>
          <span className={styles.trustSeparator} />
          <div className={styles.trustItem}>
            <ShieldCheck className="w-4 h-4 text-luxury-goldDark flex-shrink-0" />
            <span>Role-Based Access</span>
          </div>
          <span className={styles.trustSeparator} />
          <div className={styles.trustItem}>
            <FileText className="w-4 h-4 text-luxury-goldDark flex-shrink-0" />
            <span>Audit Logging</span>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
