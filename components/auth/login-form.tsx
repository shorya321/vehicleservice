"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { inputClass, fieldLabelClass } from "./auth-classes"
import { PasswordField } from "./password-field"
import { fadeSlide } from "@/lib/auth/motion"

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
      className="mt-6 flex flex-col gap-6"
      {...fadeSlide}
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
            className="auth-body-sm auth-text-link"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="login-password"
          value={loginPassword}
          onChange={setLoginPassword}
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-5 h-[52px] w-full rounded-[4px]"
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

      <p className="mt-2 text-center auth-body-sm text-[var(--text-muted)]">
        Need help signing in?{" "}
        <Link href="/contact" className="auth-text-link">
          Contact support
        </Link>
      </p>
    </motion.form>
  )
}
