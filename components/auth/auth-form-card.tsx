"use client"

import { useState, useEffect, useCallback, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { registerUser } from "@/app/(auth)/register/actions"
import { inputClass, fieldLabelClass, checkboxClass } from "@/components/auth/auth-styles"

interface AuthFormCardProps {
  initialTab: "login" | "register"
}

type TabKey = "login" | "register"

const TABS: { key: TabKey; label: string }[] = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
]

export function AuthFormCard({ initialTab }: AuthFormCardProps) {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginFieldErrors, setLoginFieldErrors] = useState<Record<string, string>>({})

  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  const validateEmail = useCallback((email: string): string | null => {
    if (!email) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? null : "Please enter a valid email address"
  }, [])

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) return null
    return password.length < 8 ? "Password must be at least 8 characters" : null
  }, [])

  const handleLoginBlur = useCallback((field: string, value: string) => {
    let fieldError: string | null = null
    if (field === "email") fieldError = validateEmail(value)
    if (field === "password") fieldError = validatePassword(value)
    setLoginFieldErrors(prev => {
      if (fieldError) return { ...prev, [field]: fieldError }
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [validateEmail, validatePassword])

  const handleRegisterBlur = useCallback((field: string, value: string) => {
    let fieldError: string | null = null
    if (field === "email") fieldError = validateEmail(value)
    if (field === "password") fieldError = validatePassword(value)
    setRegisterFieldErrors(prev => {
      if (fieldError) return { ...prev, [field]: fieldError }
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [validateEmail, validatePassword])

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Account created. Check your inbox to verify your email, then sign in."
      )
    }
    const msg = searchParams.get("message")
    if (msg) {
      setSuccessMessage(msg)
    }
  }, [searchParams])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
    router.replace(`/${tab}`, { scroll: false })
    requestAnimationFrame(() => {
      const panel = document.getElementById(`auth-panel-${tab}`)
      const firstInput = panel?.querySelector<HTMLInputElement>("input:not([type=hidden])")
      firstInput?.focus()
    })
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await userLogin(loginEmail, loginPassword)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result?.role) {
        const redirectUrl = searchParams.get("redirect")
        switch (result.role) {
          case "customer":
            router.push(redirectUrl || "/account")
            router.refresh()
            break
          case "vendor":
            router.push(redirectUrl || "/vendor/dashboard")
            router.refresh()
            break
          default:
            setError("Invalid user role")
            setLoading(false)
        }
      }
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy")
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        router.push("/login?registered=true")
      }
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="editorial-eyebrow">
        {activeTab === "login" ? "Welcome back" : "New here"}
      </div>
      <h1 className="editorial-headline mt-5 text-[clamp(2rem,4vw,2.75rem)]">
        {activeTab === "login" ? (
          <>Sign in to your account.</>
        ) : (
          <>Create an <em>account.</em></>
        )}
      </h1>
      <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-md">
        {activeTab === "login"
          ? "Enter the email you booked with. We never send marketing to this address."
          : "Used only for booking confirmations, receipts, and chauffeur contact details."}
      </p>

      <div className="mt-10 rounded-[8px] border border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] p-5 sm:p-7">
        <div
          role="tablist"
          aria-label="Authentication"
          className="auth-tabs"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`auth-panel-${tab.key}`}
                id={`auth-tab-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                className={`auth-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--auth-card-bg)] ${selected ? "active" : ""}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex items-start gap-3 rounded-[4px] border border-[var(--auth-success-border)] bg-[var(--auth-success-bg)] p-4 text-[0.875rem] text-[var(--auth-success-text)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-6 flex items-start gap-3 rounded-[4px] border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] p-4 text-[0.875rem] text-[var(--auth-error-text)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {activeTab === "login" ? (
        <form
          id="auth-panel-login"
          role="tabpanel"
          aria-labelledby="auth-tab-login"
          onSubmit={handleLogin}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="login-email" className={fieldLabelClass}>Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onBlur={(e) => handleLoginBlur("email", e.target.value)}
              required
              disabled={loading}
              placeholder="you@email.com"
              className={inputClass}
              aria-invalid={!!loginFieldErrors.email}
              aria-describedby={loginFieldErrors.email ? "login-email-error" : undefined}
            />
            {loginFieldErrors.email && (
              <p id="login-email-error" className="text-xs text-[var(--auth-error-text)] mt-1">{loginFieldErrors.email}</p>
            )}
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="login-password" className={fieldLabelClass + " mb-0"}>Password</label>
              <Link
                href="/forgot-password"
                className="text-[0.75rem] uppercase tracking-[0.16em] text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors"
              >
                Forgot
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onBlur={(e) => handleLoginBlur("password", e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                className={inputClass + " pr-12"}
                aria-invalid={!!loginFieldErrors.password}
                aria-describedby={`login-password-hint${loginFieldErrors.password ? ' login-password-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
              >
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="login-password-hint" className="text-[0.6875rem] text-[var(--text-muted)] mt-1.5">
              Minimum 8 characters
            </p>
            {loginFieldErrors.password && (
              <p id="login-password-error" className="text-xs text-[var(--auth-error-text)] mt-1">{loginFieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
            <Link href="/contact" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
              Contact support
            </Link>
          </p>
        </form>
      ) : (
        <form
          id="auth-panel-register"
          role="tabpanel"
          aria-labelledby="auth-tab-register"
          onSubmit={handleRegister}
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="reg-name" className={fieldLabelClass}>Full name</label>
            <input
              id="reg-name"
              type="text"
              name="full_name"
              autoComplete="name"
              value={registerData.full_name}
              onChange={handleRegisterInputChange}
              required
              disabled={loading}
              placeholder="As on your ID"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className={fieldLabelClass}>Email</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              value={registerData.email}
              onChange={handleRegisterInputChange}
              onBlur={(e) => handleRegisterBlur("email", e.target.value)}
              required
              disabled={loading}
              placeholder="you@email.com"
              className={inputClass}
              aria-invalid={!!registerFieldErrors.email}
              aria-describedby={registerFieldErrors.email ? "reg-email-error" : undefined}
            />
            {registerFieldErrors.email && (
              <p id="reg-email-error" className="text-xs text-[var(--auth-error-text)] mt-1">{registerFieldErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="reg-phone" className={fieldLabelClass}>Phone</label>
            <input
              id="reg-phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={registerData.phone}
              onChange={handleRegisterInputChange}
              required
              disabled={loading}
              placeholder="+971 50 123 4567"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-password" className={fieldLabelClass}>Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                onBlur={(e) => handleRegisterBlur("password", e.target.value)}
                required
                minLength={8}
                disabled={loading}
                placeholder="At least 8 characters"
                className={inputClass + " pr-12"}
                aria-invalid={!!registerFieldErrors.password}
                aria-describedby={`reg-password-hint${registerFieldErrors.password ? ' reg-password-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
              >
                {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="reg-password-hint" className="text-[0.6875rem] text-[var(--text-muted)] mt-1.5">
              Minimum 8 characters
            </p>
            {registerFieldErrors.password && (
              <p id="reg-password-error" className="text-xs text-[var(--auth-error-text)] mt-1">{registerFieldErrors.password}</p>
            )}
          </div>

          <label htmlFor="reg-terms" className="mt-1 flex items-start gap-3 cursor-pointer">
            <input
              id="reg-terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              I agree to the{" "}
              <Link href="/terms" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating account
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>

          <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
            You can also book without an account.{" "}
            <Link href="/" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
              Start a booking
            </Link>
          </p>
        </form>
      )}
      </div>
    </motion.div>
  )
}
