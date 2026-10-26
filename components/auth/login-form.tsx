"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { CustomerField, CustomerPasswordField } from "./customer-field"
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
      className="cauth-form"
      {...fadeSlide}
    >
      <CustomerField
        id="login-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        value={loginEmail}
        onChange={(e) => setLoginEmail(e.target.value)}
        required
        maxLength={254}
        disabled={loading}
        placeholder="you@email.com"
      />
      <CustomerPasswordField
        id="login-password"
        label="Password"
        icon={Lock}
        labelAside={
          <Link href="/forgot-password" className="cauth-link cauth-link--small">
            Forgot password?
          </Link>
        }
        value={loginPassword}
        onChange={setLoginPassword}
        autoComplete="current-password"
        disabled={loading}
        placeholder="Your password"
      />

      <button
        type="submit"
        disabled={loading}
        className="cauth-submit"
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

      <p className="cauth-form-note">
        Need help signing in?{" "}
        <Link href="/contact" className="cauth-link">
          Contact support
        </Link>
      </p>
    </motion.form>
  )
}
