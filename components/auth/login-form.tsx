"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { inputClass, fieldLabelClass, passwordToggleClass } from "./auth-classes"

interface LoginFormProps {
  loading: boolean
  onSubmitStart: () => void
  onError: (msg: string) => void
  onSuccess: () => void
}

export function LoginForm({ loading, onSubmitStart, onError, onSuccess }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault()
    onSubmitStart()

    try {
      const result = await userLogin(loginEmail, loginPassword)

      if (result?.error) {
        onError(result.error)
      } else if (result?.success && result?.role) {
        const raw = searchParams.get("redirect")
        const redirectUrl = raw?.startsWith("/") && !raw.startsWith("//") ? raw : null
        switch (result.role) {
          case "customer":
            router.push(redirectUrl || "/account")
            router.refresh()
            onSuccess()
            break
          case "vendor":
            router.push(redirectUrl || "/vendor/dashboard")
            router.refresh()
            onSuccess()
            break
          default:
            onError("Your account type isn't supported here. Contact support for help.")
        }
      }
    } catch {
      onError("We couldn't sign you in. Check your connection and try again.")
    }
  }

  return (
    <motion.form
      key="login"
      id="auth-panel-login"
      role="tabpanel"
      aria-labelledby="auth-tab-login"
      onSubmit={handleLogin}
      className="mt-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <label htmlFor="login-email" className={fieldLabelClass}>Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          required
          maxLength={254}
          disabled={loading}
          placeholder="you@email.com"
          className={inputClass}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="login-password" className={fieldLabelClass + " mb-0"}>Password</label>
          <Link
            href="/forgot-password"
            className="text-[0.8125rem] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showLoginPassword ? "text" : "password"}
            autoComplete="current-password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            maxLength={128}
            disabled={loading}
            placeholder="••••••••"
            className={inputClass + " pr-12"}
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            aria-label={showLoginPassword ? "Hide password" : "Show password"}
            className={passwordToggleClass}
          >
            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
        Need help signing in?{" "}
        <Link href="/contact" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
          Contact support
        </Link>
      </p>
    </motion.form>
  )
}
